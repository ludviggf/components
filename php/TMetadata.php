<?php
    namespace components\php;
    
    // extrai lista de propriedades dos campos de uma tabela

    class TMetadata 
    {
        public static function getColumns($connection, $tableName) {
            $result = [];
            if ($connection->sgbd === TDrivers::SGBD_PGSQL) {
                $query_cols = new Query(
                        $connection, 
                        "select
                        column_name,
                        ordinal_position,
                        is_nullable,
                        data_type,
                        character_maximum_length,
                        numeric_precision_radix,
                        numeric_scale,
                        udt_name
                        from
                        information_schema.columns
                        where 
                        tableName = :tableName",
                        [TQuery::Param('tableName', $tableName, \PDO::PARAM_STR)]
                    );
                $query_cols->open();
                while (!$query_cols->eof()) {
                    $column = new stdClass();
                    $column->fieldName = $query_cols->fields->column_name;
                    $column->dataType = TDataTypes::FT_UNKNOWN;
                    $column->maxLength = 0;
                    $column->decimals = 0;
                    $column->required = false;
                    if ($query_cols->fields->is_nullable === 'NO') { $column->required = true; }
                    switch ($query_cols->fields->udt_name) {
                        case "int4": 
                            $column->dataType = TDataTypes::FT_INTEGER;
                            $column->maxLength = 9;
                            break;
                        case "varchar":
                            $column->dataType = TDataTypes::FT_STRING;
                            $column->maxLength = $query_cols->fields->character_maximum_length;
                            break;
                        case "numeric":
                            $column->dataType = TDataTypes::FT_NUMERIC;
                            $column->decimals = $query_cols->fields->numeric_scale;
                            $column->maxLength = $query_cols->fields->numeric_precision_radix;
                            if ($column->decimals > 0) { $column->maxLength = $column->maxLength + 1 + $column->decimals; }
                            break;
                        case "date":
                            $column->dataType = TDataTypes::FT_DATE;
                            $column->maxLength = 10;
                            break;
                        case "time":
                            $column->dataType = TDataTypes::FT_TIME;
                            $column->maxLength = 12;
                            break;
                        case "timestamp":
                            $column->dataType = TDataTypes::FT_DATETIME;
                            $column->maxLength = 10+1+12;
                            break;
                        case "bytea":
                            $column->dataType = TDataTypes::FT_BLOB;
                            $column->maxLength = 20;
                            break;
                        case "text":
                            $column->dataType = TDataTypes::FT_MEMO;
                            $column->maxLength = 20;
                            break;
                        case "bool": 
                            $column->dataType = TDataTypes::FT_BOOLEAN;
                            $column->maxLength = 3;
                            break;
                        case "int8":
                            $column->dataType = TDataTypes::FT_BIGINT;
                            $column->maxLength = 18;
                            break;
                        case "bpchar":
                            $column->dataType = TDataTypes::FT_STRING;
                            $column->maxLength = 1;
                            break;
                        case "float8":
                            $column->dataType = TDataTypes::FT_FLOAT;
                            $column->maxLength = 15+1+4;
                            break;
                        case "money":
                            $column->dataType = TDataTypes::FT_MONEY;
                            $column->decimals = 4;
                            $column->maxLength = 12+1+4;
                            break;
                    }
                    array_push($result, $column);
                    $query_cols->next();
                }
            }
            return $result;
        }
    }
    