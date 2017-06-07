<?php
    namespace components\php;
    
    class TMethodInfo {
        public $id = 0;
        public $name = '';
    }
    class TClassInfo {
        public $id = 0;
        public $title = '';
        public $nick = '';
        public $name = '';
        public $path = '';
        public $phpFile = '';
    }
    class TStatus {
        public $code = 200;
        public $message = '';
    }
    class TRequest {
        public $class;
        public $method;
        public $fields = [];
        public $data = [];
        public function __construct(){
            $this->class = new TClassInfo();
            $this->method = new TMethodInfo();
        }
        public static function getParam($name, $default = "")
        {
            $param = "";
            if (isset($_GET[$name])) {
                $param = $_GET[$name];
            } elseif (isset($_POST[$name])) {
                $param = $_POST[$name];
            } else {
                $param = $default;
            }
            return $param;
        }
    }
    class TResponse {
        public $status;
        public $class;
        public $fields = [];
        public $data = [];
        public function __construct(){
            $this->status = new TStatus();
            $this->class = new TClassInfo();
        }
    }
    class TSession {
        public function __construct() {
            $this->loggedIn = false;
            $this->load();
        }
        public function load() {
            foreach ($_SESSION as $key => $val) {
                $this->$key = $val;
            }
        }
        public function save() {
            foreach ($this as $key => $val) {
                $_SESSION[$key] = $val;
            }            
        }
    }
    class TServer {
        public $request;
        public $response;
        public $connection;
        public $authConnection;
        public $session;
        public $onUserAuthenticate;
        public $onMethodExists;
        public $onMethodAuthorize;
        public $onCreateConnection;
        
        public function userAuthenticate() {
            $a = false;
            if (is_callable($this->$onUserAuthenticate)) {
                $a = $this->$onUserAuthenticate($params);
            } else {
                $a = true;
            }
            if (!$a) {
                if ($this->response->status->code == 200) {
                    $this->response->status->code = 401;
                    $this->response->status->message = 'Unauthorized';
                }
            }
        }
        public function methodExists() {
            $e = false;
            if (is_callable($this->onMethodExists)) {
                $e = $this->onMethodExists($params);
            } else {
                $e = true;
            }
            if (!$e) {
                if ($this->response->status->code == 200) {
                    $this->response->status->code = 404;
                    $this->response->status->message = 'Method not found';
                }
            }
        }
        public function methodAuthorize() {
            $a = false;
            if (is_callable($this->onMethodAuthorize)) {
                $a = $this->$onMethodAuthorize($params);
            } else {
                $a = true;
            }
            if (!$a) {
                if ($this->response->status->code == 200) {
                    $this->response->status->code = 405;
                    $this->response->status->message = 'Method not allowed';
                }
            }
        }
        public function createConnection() {
            if (is_callable($this->$onCreateConnection)) {
                $this->connection = $this->$onCreateConnection();
            }
        }
        public function run() {
            try {
                $this->response = new TResponse;
                unset($this->response->class->phpFile);
                unset($this->response->class->path);

                $this->session = new TSession;

                $this->request = new TRequest();
                $this->request->class->name = $this->request->getParam('class');
                $this->request->method->name = $this->request->getParam('method');
                $this->request->fields = json_decode($this->request->getParam('fields', ''));
                $this->request->data = json_decode($this->request->getParam('data', ''));

                //--------------------------------------------------
                // checar se o usuario esta logado
                //--------------------------------------------------            
                $continue = $this->userAuthenticate();

                //--------------------------------------------------
                // checar se a classe e metodo existem
                //--------------------------------------------------            
                if ($continue) {
                    $continue = $this->methodExists();
                }

                //--------------------------------------------------
                // criar a classe e executar o metodo
                //--------------------------------------------------            
                if ($continue) {
                    require_once $this->request->class->phpFile;
                    $xName = $this->request->class->path . "\\" . $this->request->class->name;
                    $xClass = new $xName($this);
                    $xClass->execute();
                }                
            
            } catch (Exception $e) {
                $this->response->status->code = 500;
                $this->response->status->message = $e->getMessage();
            } finally {   
                echo json_encode($this->response);
            }                      
        }
    }
