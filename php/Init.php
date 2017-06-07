<?php

    spl_autoload_register( function ($className) {
        $className = ltrim($className, '\\');
        $dirName = '';
        $fileName  = '';
        $namespace = '';
        if ($lastNsPos = strrpos($className, '\\')) {
            $namespace = substr($className, 0, $lastNsPos);
            $className = substr($className, $lastNsPos + 1);
            $dirName  = str_replace('\\', DIRECTORY_SEPARATOR, $namespace) . DIRECTORY_SEPARATOR;
        }
        $fileName = $dirName . str_replace('_', DIRECTORY_SEPARATOR, $className) . '.php';
        if (!file_exists($fileName)) {
            $fileName = substr($dirName, 0, -1) . '.php';
        }
        if (file_exists($fileName)) {
            require_once $fileName;
        }
    });    