<?php
    namespace components\php;
    
    use components\php\Config;
    use components\php\TDB\TQuery;
    use components\php\TDB\TQParam;
    
    abstract class TDataClass {
        public $request;
        public $response;
        public $phpFile = '';
        //public $htmlFile = '';
        //public $jsFile = '';
        public $server;
        public $connection;
        public $selectSQL = '';
        public $insertSQL = '';
        public $updateSQL = '';
        public $deleteSQL = '';
        public $tableName = '';
        public $fields = [];
        public $profileId = 0;
        
        // criar o 
        public function  __construct($server){
            // linkar com as propriedades do server
            $this->server = $server;
            $this->connection = $server->connection;
            $this->request = $server->request;
            $this->response = $server->response;
            $this->phpFile = $this->request->class->phpFile;
            // criar o connection
            if (($this->server->session->loggedIn == true) & (empty($this->connection) == true)) {
                $this->connection = $this->server->createDBConnection();
            }
        } 

        // executa um método e solicitado no server passado na criacao do objeto
        // se o usuario tiver permissao para o metodo
        public function execute() {
            if ($this->server->authorizeMethod()) {
                $method = $this->request->method->name;
                $this->$method();
            }
        }

        public function openQuery($sql = null, $where = null, $params = null) {
            // se nao passou sql, usar o default
            if (empty($sql)) $sql = $this->selectSQL; 
            // se passou where concatenar com o sql
            if (!empty($where)) $sql = $sql . $where; 
            // se passou filtro nos params entao montar o array de params
            $qparams = [];
            if (!empty($params)) {
                foreach ($params as $param => $valor) {
                    // o prefixo __ define que o param não é um filtro para a query
                    if (substr($param, 0, 2) != '__') {
                        if (gettype($valor) == 'NULL') {
                            array_push($qparams, TQuery::Param($param, $valor, \PDO::PARAM_NULL));
                        } elseif (gettype($valor) == 'boolean') {
                            array_push($qparams, TQuery::Param($param, $valor, \PDO::PARAM_BOOL));
                        } elseif (gettype($valor) == 'integer') {
                            array_push($qparams, TQuery::Param($param, $valor, \PDO::PARAM_INT));
                        } else {
                            array_push($qparams, TQuery::Param($param, $valor, \PDO::PARAM_STR));
                        }
                    }
                }
            }
            // abrir a query e devolver os dados
            $query = new TQuery($this->connection, $sql, $qparams);
            $query->open();
            return $query;
        }
        
        public function findField($fieldList, $fieldName) {
            $result = null;
            foreach ($fieldList as $field) {
                if ((isset($field->name)) && (strcasecmp($fieldName, $field->name) == 0)) {
                    $result = $field;
                    break;
                }
            }    
            return $result;
        }
        
        // extrair campos pega a metadata da query e converte para a estrutura campo
        // se ja existem informacoes no campo, tipo definidas manualmente, nao altera-las
        // o foi definido manualmente nos campos tem preferencia
        public function extractFieldDefs($query, $fieldList) {
            if (!isset($fieldList)) { $fieldList = []; }
            $query->getMetadata();
            foreach ($query->metadata->columns as $col) {
                //ver se o campo já foi definido
                $field = $this->findCampo($fieldList, $col->name);
                if (!isset($field)) {
                    // field novo
                    $field = new stdClass();
                    $field->name = $col->name;
                    $field->title = $col->comment;
                    $field->dataType = $col->dataType;
                    $field->fieldKind = $col->fieldKind;
                    $field->maxLength = $col->maxLength;
                    $field->decimals = $col->decimals;
                    $field->required = $col->required;
                    array_push($fieldList, $field);
                } else {
                    // field definido pelo programador, soh complementar o q faltar
                    if ((!isset($field->name)) || ($field->name == '')) { $field->name = $col->name; }
                    if ((!isset($field->title)) || ($field->title == '')) { $field->title = $col->comment; }
                    if ((!isset($field->dataType)) || ($field->dataType == '')) { $field->dataType = $col->dataType; }
                    if ((!isset($field->fieldKind)) || ($field->fieldKind == '')) { $field->nome = $col->fieldKind; }
                    if (!isset($field->maxLength)) { $field->maxLength = $col->maxLength; }
                    if (!isset($field->decimals)) { $field->decimals = $col->decimals; }
                    if (!isset($field->required)) { $field->required = $col->required; }
                }
            }
            return $fieldList;
        }
        
    }
