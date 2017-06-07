<?php
    namespace components\php;
    
    // classe Parser para converter SQL literal em objeto

    class TParser 
    {

        // procura pelo proximo token dentro do SQL a partir de uma posição
        // um token pode ser campo, uma palavra chave, um comentário, um texto...
        public static function nextToken($S, &$P) {
            $result = '';
            $L = strlen($S);

            $Letras = range('a', 'z');
            $Letras = array_merge(array_values($Letras), array_values(range('A', 'Z')));
            $Letras = array_merge(array_values($Letras), array_values(range('0', '9')));
            $Letras = array_merge(array_values($Letras), array_values(range(chr(192), chr(255))));
            array_push($Letras, '.', '_', '$', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9');

            // pular brancos no inicio
            while (($P < $L) && ($S[$P] <= ' ')) { ++$P; }
            // comentario de bloco
            $ss = substr($S, $P, 2);
            if ($ss === '/*') {
                $result = substr($S, $P);
                $I = strpos($result, '*/');
                if ($I >= 0) { $result = substr($result, 0, $I+2); }
                $result = str_replace('|', chr(13), $result);
                $result = str_replace('|', chr(10), $result);
                $P += strlen($result);
                return $result;
            // comentario de linha    
            } elseif (($ss === '//') || ($ss === '--')) {
                $result = substr($S, $P);
                $I = strpos($result, PHP_EOL);
                if ($I === false) $I = strpos($result, chr(13));
                if ($I === false) $I = strpos($result, chr(10));
                if ($I >= 0) { $result = substr($result, 0, $I); }
                $P = $P + strlen($result);
                return $result;
            // operadores duplos
            } elseif (($ss === '<=') || ($ss === '>=') || ($ss === '<>') || ($ss === '||')) {
                $result = $ss;
                $P = $P + 2;
                return $result;
            }
            // texto normal
            $I = $P;
            $Literal1 = false;
            $Literal2 = false;
            while ($P < $L) {
                $WBreak = false;
                $Skip = 1;
                $Char = $S[$P];
                // caracter menor igual a branco quebra
                if ((!$Literal1) && (!$Literal2) && ($Char <= ' ')) {
                    $WBreak = true;

                // aspa simples quebra se nao estiver grudada num ponto
                } elseif ((!$Literal2) && ($Char === "'")) { 
                    if ($Literal1) { $Literal1 = false; } else { $Literal1 = true; }
                    if ((!$Literal1) && (substr($S, $P+1, 1) <> '.')) { $WBreak = true; }

                // aspa dupla quebra se nao estiver grudada num ponto
                } elseif ((!$Literal1) && ($Char === '"')) {
                    if ($Literal2) { $Literal2 = false; } else { $Literal2 = true; }
                    if ((!$Literal2) && (substr($S, $P+1, 1) != '.')) { $WBreak = true; }

                //qualquer coisa diferente dos caracteres texto, numerico, ... quebra
                } elseif ((!$Literal1) && (!$Literal2) && (!in_array($Char, $Letras, true))) {
                    $WBreak = true;
                    if ($P > $I) { $Skip = 0; }
                    if (($Char === '*') && ($P > $I) && ($S[$P-1] === '.')) { $Skip = 1; } //exeção X.*
                }
                $P += $Skip;
                if ($WBreak) break;
            }
            $result = rtrim(substr($S, $I, $P - $I ) );
            return $result;
        }

        // converte uma string SQL em um array de Tokens
        public static function sqlToTokens($sql) {
            $tokens = [];
            $P = 0;
            while ($P < strlen($sql)) {
                $S = Parser::nextToken($sql, $P);
                if (($S) && ($S != "")) {
                    array_push($tokens, $S);
                }
            }
            return $tokens;
        }

        public static function findSQLSection($tokens, $KeyWord, $TermKeys, &$BegPos, &$EndPos, &$TermKeyWord, $SkipEndRequest) {
            $I = 0;
            $X = 0;
            $RoundBracketLevel = 0;
            $SquareBracketLevel = 0;
            $result = false;
            $TermKeyWord = '';
            if ($BegPos < 0) { $BegPos = 0; }
            $EndPos = count($tokens)-1;
            $C = count($tokens);
            for ($I = $BegPos; $I < $C; $I++) {
                if ((!$result) && (($KeyWord === '') || (strcasecmp($KeyWord, $tokens[$I]) === 0))) {
                    $result = true;
                    $BegPos = $I;
                    if ($tokens[$I] === '(') { 
                        ++$RoundBracketLevel; 
                    } elseif ($tokens[$I] === '[') { 
                        ++$SquareBracketLevel;
                    }
                    if (empty($TermKeys)) { break; }
                } elseif ($result) {
                    if ($tokens[$I] === '(') { ++$RoundBracketLevel; }
                    elseif ($tokens[$I] === ')') { --$RoundBracketLevel; }
                    elseif ($tokens[$I] === '[') { ++$SquareBracketLevel; }
                    elseif ($tokens[$I] === ']') { --$SquareBracketLevel; }

                    if (($RoundBracketLevel <= 0) && ($SquareBracketLevel <= 0)) {
                        for ($X = 0; $X < count($TermKeys); $X++) {
                            if (strcasecmp($TermKeys[$X], $tokens[$I]) === 0) {
                                $EndPos = $I - 1 + $SkipEndRequest;
                                $TermKeyWord = $TermKeys[$X];
                                break;
                            }
                        }
                    }
                    if ($TermKeyWord != '') { break; }
                }
            }
            return $result;
        }
        // extrai o nome da tabela principal de uma lista de tokens
        public static function extractTableName($tokens) {
            $B = 0;
            $E = 0;
            $T = '';
            $result = '';
            if (Parser::findSQLSection($tokens, 'FROM', array('WHERE','GROUP','HAVING','UNION','ORDER','LIMIT', 'OFFSET', ';'), $B, $E, $T, 0)) {
                if ($E > $B) { $result = $tokens[$B + 1]; }
            }
        }

        public static function extractTableList($tokens) {
            $result = [];
            $B = 0;
            $E = 0;
            $T = '';
            Parser::findSQLSection($tokens, 'FROM', array('WHERE', 'GROUP', 'HAVING', 'UNION', 'ORDER', 'LIMIT', 'OFFSET', ';'), $B, $E, $T, 0);
            if ($E > $B) {$B++;}
            while (true) {
                Parser::findSQLSection($tokens, '', array(',', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'INNER', 'JOIN', 'WHERE', 'GROUP', 'HAVING', 'UNION', 'ORDER', 'LIMIT', 'OFFSET', ';'), $B, $E, $T, 0);
                if ($E >= $B) {
                    $expression = array_slice($tokens, $B, $E-$B+1);
                    $join = '';
                    $tableName = '';
                    $table_alias = '';
                    $on = [];
                    if (($B <= $E) && (strcasecmp($tokens[$B], 'LEFT') == 0)) { 
                        ++$B; 
                        $join .= 'LEFT ';
                    }
                    if (($B <= $E) && (strcasecmp($tokens[$B], 'RIGHT') == 0)) { 
                        ++$B; 
                        $join .= 'RIGHT ';
                    }
                    if (($B <= $E) && (strcasecmp($tokens[$B], 'FULL') == 0)) { 
                        ++$B; 
                        $join .= 'FULL ';
                    }
                    if (($B <= $E) && (strcasecmp($tokens[$B], 'OUTER') == 0)) { 
                        ++$B; 
                        $join .= 'OUTER ';
                    }
                    if (($B <= $E) && (strcasecmp($tokens[$B], 'INNER') == 0)) { 
                        ++$B; 
                        $join .= 'INNER ';
                    }
                    if (($B <= $E) && (strcasecmp($tokens[$B], 'JOIN') == 0)) { 
                        ++$B; 
                        $join .= 'JOIN';
                    }
                    // nome da tabela
                    if ($B <= $E) {
                        $tableName = $tokens[$B];
                        ++$B;
                        if ($B <= $E) {
                            // alias
                            $table_alias = $tokens[$B];
                            if (strcasecmp($tokens[$B], 'ON') == 0) { $table_alias = ''; }
                            ++$B;
                            if ($B <= $E) {
                                // on
                                if (strcasecmp($tokens[$B], 'ON') == 0) {
                                    ++$B;
                                    if ($B <= $E) {
                                        $on = array_slice($tokens, $B, $E-$B+1);
                                    }
                                }
                            }
                        }
                    }    
                    $table = new stdClass();
                    $table->expression = $expression;
                    if ($join != '') { $table->join = $join; }
                    if ($tableName != '') { $table->tableName = $tableName; }
                    if ($table_alias != '') { $table->table_alias = $table_alias; }
                    if (count($on) > 0) { $table->on = $on; }
                    array_push($result, $table);
                    $B = $E + 1;
                    $T = strtoupper($T);
                    if (!array_search($T, array(',', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'INNER', 'JOIN'))) { break; }
                } else {
                    break;
                }
            }
            return $result;
        }

        // extrair uma lista colunas/campos de um select
        public static function extractColumnList($tokens, $table_list) {
            $result = [];
            $B = 0;
            $E = 0;
            $T = '';
            $I = 0;
            $C = 0;
            $S = '';
            $last = '';
            $penultimate = '';
            if (empty($table_list)) { $table_list = Parser::extractTableList($tokens); }
            if (Parser::findSQLSection($tokens, 'SELECT', array(',', 'FROM'), $B, $E, $T, 0)) {
                if ($E > $B) { 
                    ++$B; //saltar o select
                    if (strcasecmp($tokens[$B], 'DISTINCT') === 0) { ++$B; }
                    while (true) {
                        Parser::findSQLSection($tokens, '', array(',', 'FROM'), $B, $E, $T, 0);
                        if ($E >= $B) {
                            $expression = array_slice($tokens, $B, $E-$B+1);
                            $comment = '';
                            $field_alias = '';
                            $C = count($expression);
                            if ($C > 1) {
                                // extrair comentários
                                for ($I = ($C - 1); $I >= 0; $I--) {
                                    $S = substr($expression[$I], 0, 2);
                                    if (($S === '--') || ($S === '\\')) {
                                        $comment = trim(substr($expression[$I], 2)) . $comment;
                                        unset($expression[$I]);
                                    }
                                }
                                $C = count($expression);
                                //extrair alias do nome do campo
                                $last = $expression[$C-1];
                                if (($last != ')') && ($last != ']')) {
                                    if (count($expression) === 2) {
                                        $field_alias = $expression[1];
                                        unset($expression[1]);
                                    } elseif (count($expression) > 2) {
                                        $penultimate = $expression[$C-2];
                                        if (($penultimate != '+') && ($penultimate != '-') && ($penultimate != '*') && ($penultimate != '/') && ($penultimate != '%')) {
                                            $field_alias = $last;
                                            unset($expression[$C-1]);
                                            if (strcasecmp($penultimate, 'AS') === 0) {
                                                unset($expression[$C-2]);
                                            }
                                        }
                                    }
                                }
                            }    
                            $C = count($expression);
                            $fieldName = '';
                            $tableName = '';
                            $table_alias = '';
                            if ($C === 1) { 
                                $fieldName = $expression[0]; 
                                // determinar o nome da tabela
                                $A = explode('.', $fieldName);
                                if (count($A) === 2) {
                                    $fieldName = $A[1];
                                    // encontrar a tabela com o mesmo alias
                                    for ($I = 0; $I < count($table_list); $I++) {
                                        if (strcasecmp($A[0], $table_list[$I]->table_alias) === 0) {
                                            $tableName = $table_list[$I]->tableName;
                                            $table_alias = $table_list[$I]->table_alias;
                                            break;
                                        }
                                    }
                                } else {
                                    // assume q o campo pertence a primeira tabela
                                    $tableName = $table_list[0]->tableName;
                                    if (isset($table_list[0]->table_alias)) { $table_alias = $table_list[0]->table_alias; }
                                }
                            }
                            $column = new stdClass();
                            $column->expression = $expression;
                            if ($fieldName != '') { $column->fieldName = $fieldName; }
                            if ($field_alias != '') { $column->field_alias = $field_alias; }
                            if ($comment != '') { $column->comment = $comment; }                            
                            if ($tableName != '') { $column->tableName = $tableName; }                            
                            if ($table_alias != '') { $column->table_alias = $table_alias; }                            
                            array_push($result, $column);
                            $B = $E + 2;
                            if (strcasecmp($T, 'FROM') === 0) { break; }
                        } else {
                            break;
                        }
                    }
                }
            }
            return $result;
        }
    }
    