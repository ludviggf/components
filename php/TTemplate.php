<?php
    namespace components\php;
    
    class Template {
        protected $file;
        protected $values = array();
        public function __construct($file) {
            $this->file = $file;
        }
        public function set($key, $value) {
            $this->values[$key] = $value;
        }
        public function output() {
            if (!file_exists($this->file)) {
            	return "Error carregando template ($this->file).<br />";
            }
            $output = file_get_contents($this->file);
            
            foreach ($this->values as $key => $value) {
            	$tagToReplace = "[@$key]";
            	$output = str_replace($tagToReplace, $value, $output);
            }

            return $output;
        }
        
        static public function merge($templates, $separator = "\n") {
            $output = "";
            
            foreach ($templates as $template) {
                $class = get_class($template);
            	$content = ($class !== "components\php\Template")
            		? "Erro, tipo da classe invalido - esperado Template."
            		: $template->output();
            	$output .= $content . $separator;
            }
            
            return $output;
        }
    }

?>