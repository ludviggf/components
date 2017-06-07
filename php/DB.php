<?php
    namespace components\php\TDB;
    
    use components\php\TMetadata;
    use components\php\TParser;
    
    // classe de conexao como o banco de dados
    class TDataTypes {
        // tipos de dado
        const FT_UNKNOWN = 'unknown';
        const FT_INTEGER = 'integer';
        const FT_BIGINT = 'bigint';
        const FT_STRING = 'string';
        const FT_NUMERIC = 'numeric';
        const FT_FLOAT = 'float';
        const FT_DATE = 'date';
        const FT_TIME = 'time';
        const FT_DATETIME = 'datetime';
        const FT_MONEY = 'money';
        const FT_BOOLEAN = 'boolean';
        const FT_MEMO = 'memo';
        const FT_BLOB = 'blob';
    }
    class TFieldKinds {
        // tipos de campo
        const FK_DATA = 'data';
        const FK_LOOKUP = 'lookup';
        const FK_CALC = 'calc';
    }
    class TDrivers {
        // bancos suportados
        const SGBD_PGSQL = 'pgsql';
    }
    class TConnection 
    {
        public $dbh;
        public $sgbd;
        public $host;
        public $port;
        public $dbname;
        public $user;
        public $password;
        private $transaction_owner = null;
        function __construct($params) {
            //$sgbd = '', $host = '', $port = '', $dbname = '', $user = '', $password = '') {
            $this->sgbd = $params->sgbd;
            $this->host = $params->host;
            $this->port = $params->port;
            $this->dbname = $params->dbname;
            $this->user = $params->user;
            $this->password = $params->password;
        }
        function active() {
            return isset($this->dbh);
        }
        function open() {
            if (!$this->active()) {
                $dsn = "$this->sgbd:dbname={$this->dbname};host={$this->host};port={$this->port}";
                $this->dbh = new \PDO($dsn, $this->user, $this->password);
                $this->dbh->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
            }
        }
        function close() {
            if ($this->active()) {
                $this->dbh = null;
            }
        }
        function startTransaction($owner) {
            $result = false;
            if ((!$owner) && ($this->active()) && (!$this->dbh->inTransaction()) ) {
                $result = $this->dbh->beginTransaction();
                if ($result === true) {
                    $this->transaction_owner = $owner;
                }
            }
            return $result;
        }
        function commitTransaction($owner) {
            $result = false;
            if ((!$owner) && ($this->active()) && ($this->dbh->inTransaction()) && ($this->transaction_owner === $owner) ) {
                $result = $this->dbh->commit();
            }
            return $result; 
        }
        function inTransaction() {
            $result = (($this->active()) && ($this->dbh->inTransaction()));
            return $result;
        }
    }

    // classe QParam, para criar os parametros que passa na Query

    class TQParam {
        public $name;
        public $value;
        public $type;
        function __construct($name, $value, $type) {
            $this->name = $name;
            $this->value = $value;
            $this->type = $type;
        }
    }

    // classe Query para selecionar dados do banco

    class TQuery 
    {
        
        private $stmt;
        private $_recNo;
        private $_recordCount;
        public $connection;
        public $sql;
        public $params;
        public $data;
        public $fields;
        public $metadata;
        private $_bof;
        private $_eof;
        function __construct($connection = null, $sql = '', $params = null) {
            $this->connection = $connection;
            $this->sql = $sql;
            $this->params = $params;
        }
        public static function Param($name, $value, $type = \PDO::PARAM_STR) {
            return new TQParam($name, $value, $type);
        }
        function recNo($val) {
            if ((isset($val)) && ($this->_recordCount > 0)) {
                if ($val < 0) { $val = 0; }
                if ($val >= $this->_recordCount) { $val = $this->_recordCount - 1; }
                $this->_recNo = $val;
                $this->getCurrentRecord();
            }
            return $this->_recNo;
        }
        function recordCount() {
            return $this->_recordCount;
        } 
        function bof() {
            return $this->_bof;
        }
        function eof() {
            return $this->_eof;
        }
        private function getCurrentRecord() {
            $this->fields = $this->data[$this->_recNo]; 
        }
        function active() {
            return (isset($this->stmt) && isset($this->data));
        }
        function isEmpty() {
            if ($this->_recordCount === 0) {
                return true;
            } else {
                return false;
            }
        }
        function close() {
            if ($this->active()) {
                $this->pdoStatement = null;
                $this->data = null;
                $this->fields = null;
                $this->_recordCount = 0;
                $this->_recNo = -1;
                $this->_bof = true;
                $this->_eof = true;
                $this->metadata = null;
            }
        }
        function open($sql = null) {
            $this->connection->open();
            $this->close();
            if (isset($sql)) {
                $this->sql = $sql;
            }
            $this->stmt = $this->connection->dbh->prepare($this->sql);
            if (isset($this->params)) {
                foreach ($this->params as $par) {
                    $this->stmt->bindValue(':'.$par->name, $par->value, $par->type ?: \PDO::PARAM_STR);
                }
            }
            $result = $this->stmt->execute();

            $this->data = $this->stmt->fetchAll(\PDO::FETCH_OBJ);

            $this->_recordCount = count($this->data);

            $this->first();

            return $result;
        }
        function next() {
            if ($this->isEmpty() === false) {
                if ($this->_recNo === ($this->_recordCount-1)) {
                    $this->_eof = true;
                } else {
                    $this->recNo($this->_recNo + 1);
                }
                $this->_bof = false;
            }    
            return $this->_recNo;
        }
        function prior() {
            if ($this->isEmpty() === false) {
                if ($this->_recNo === 0) {
                    $this->_bof = true;
                } else {
                    $this->recNo($this->_recNo - 1);
                }
                $this->_eof = false;
            }
            return $this->_recNo;
        }
        function first() {
            if ($this->isEmpty() === false) {
                $this->recNo(0);
                $this->_bof = true;
                $this->_eof = false;
            }   
            return $this->_recNo;
        }
        function last() {
            if ($this->isEmpty() === false) {
                $this->recNo($this->_recordCount - 1);
                $this->_bof = false;
                $this->_eof = true;
            }
            return $this->_recNo;
        }
        public function loadParams($param_values) {
            $this->params = [];
            foreach ($param_values as $name => $value) {
                if (gettype($value) === 'NULL') {
                    array_push($this->params, new QParam($name, $value, \PDO::PARAM_NULL));
                } elseif (gettype($value) === 'boolean') {
                    array_push($this->params, new QParam($name, $value, \PDO::PARAM_BOOL));
                } elseif (gettype($value) === 'integer') {
                    array_push($this->params, new QParam($name, $value, \PDO::PARAM_INT));
                } else {
                    array_push($this->params, new QParam($name, $value, \PDO::PARAM_STR));
                }
            }
        }
        function columnCount() {
            return $this->stmt->columnCount();
        }
        function getMetadata() {
            // extrai dados a partir do sql select
            $this->metadata = new stdClass();
            $this->metadata->tokens = TParser::sqlToTokens($this->sql);
            $this->metadata->tables = TParser::extractTableList($this->metadata->tokens);
            $this->metadata->columns = TParser::extractColumnList($this->metadata->tokens, $this->metadata->tables);
            // puxar informacao do banco
            for ($i = 0; $i < count($this->metadata->tables); $i++) {
                $tableName = $this->metadata->tables[$i]->tableName;
                $tbColumns = TMetadata::getColumns($this->connection, $tableName);
                for ($j = 0; $j < count($this->metadata->columns); $j++) {
                    $column = $this->metadata->columns[$j];
                    if (isset($column->tableName) && ($column->tableName != '')) {
                        if (strcasecmp($tableName, $column->tableName) === 0) {
                            $fieldName = $column->fieldName;
                            for ($k = 0; $k < count($tbColumns); $k++) {
                                $tb_column = $tbColumns[$k];
                                $tb_field = $tb_column->fieldName;
                                if (strcasecmp($fieldName, $tb_field) === 0) {
                                    if (isset($tb_column->dataType)) { $column->dataType = $tb_column->dataType; }
                                    if (isset($tb_column->maxLength)) { $column->maxLength = $tb_column->maxLength; }
                                    if (isset($tb_column->decimals)) { $column->decimals = $tb_column->decimals; }
                                    if (isset($tb_column->required)) { $column->required = $tb_column->required; }
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            //se esta aberta a query entao setar o nome das colunas gerado pelo select
            if ($this->active()) {
                $c =  $this->stmt->columnCount();
                for ($i = 0; $i < $c; $i++) {
                    $meta = $this->stmt->getColumnMeta($i);
                    if ($i < count($this->metadata->columns)) {
                        $this->metadata->columns[$i]->name = $meta['name'];
                    }
                }
            }
        }
    }

    //include 'rad/php/TMetadata';
    
    //include 'rad/php/TParser';
    
    