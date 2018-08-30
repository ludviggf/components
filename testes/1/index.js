function isObject(obj) {
    return obj !== null && typeof obj === 'object'
}

function isFunction(obj) {
    return obj !== null && typeof obj === 'function'
}

function isUndef(v) {
    return v === undefined || v === null
}

function isDef(v) {
    return v !== undefined && v !== null
}

function isTrue(v) {
    return v === true
}

function isFalse(v) {
    return v === false
}

function isPrimitive(value) {
    return (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'symbol' ||
        typeof value === 'boolean'
    )
}

function isString(value) {
    return typeof value === 'string' || value instanceof String;
}

function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
}

function isArray(value) {
    return Array.isArray(value);
}


function mixin(source, target) {
    return Object.assign(target, source);
}

function compareValues({ v1, v2, reverse = false, emptyFirst = false }) {
    var r = 0;
    if (v1 != v2) {
        if (isDef(v1) && isDef(v2)) {
            r = v1 < v2 ? -1 : 1;
            if (reverse) r = r * (-1);
        } else {
            r = emptyFirst ? (isUndef(v1) ? -1 : 1) : (isUndef(v2) ? -1 : 1);
        }
        return r;
    }
    return r;
}

class FieldModel {
    constructor ({name, title, onGetValue, onSetValue, onGetText, onSetText}) {
        this.name = name;
        this.title = title || name;
        this.onGetValue = onGetValue;
        this.onSetValue = onSetValue;
        this.onGetText = onGetText || 
            function (v) {
                return String(v);
            };
        this.onSetText = onSetText;
    }
}

class StringField extends FieldModel {
    constructor ({name, title, onGetValue, onSetValue, onGetText, onSetText}) {
        onSetValue = onSetValue || 
            function (v) {
                if (isDef(v)) { v = String(v); } else { v = null; }
                return v;
            };
        super({name, title, onGetValue, onSetValue, onGetText, onSetText});
    }    
}

class IntegerField extends FieldModel {
    constructor ({name, title, onGetValue, onSetValue, onGetText, onSetText}) {
        onSetValue = onSetValue || 
            function (v) {
                v = parseInt(v) || null;
                return v;
            };
        super({name, title, onGetValue, onSetValue, onGetText, onSetText});
    }     
}

class DataField {
    constructor(fieldModel) {
        this.fieldModel;
    }
    get value() {
        return this._private.fieldModel._private. fieldDef._private.dataSet._private.getFieldValue(this.filedDef); // return this._private.data[this._private.dataSet.index]
    }
    set value(v) {
        this._private.value = v;
    }
}

class DataSet {
    constructor({ data, fields, filter, sort }) {
        var self = this;
        this._private = { 
            data, 
            filter, 
            sort,
            getFieldValue: function (name) {
                var v = self.rows[self.index][name];
                if (isDef(self.fields[name].onGetValue)) {
                    v = self.fields[name].onGetValue(v);
                }
                return v;
            },
            setFieldValue: function (name, value) {
                if (isDef(self.fields[name].onSetValue)) {
                    value = self.fields[name].onSetValue(value);
                }
                self.rows[self.index][name] = value;
            },
            getFieldText: function (name) {
                var v = self._private.getFieldValue(name);
                if (isDef(self.fields[name].onGetText)) {
                    v = self.fields[name].onGetText(v);
                }
                return v;
            },
            setFieldText: function (name, value) {
                if (isDef(self.fields[name].onSetText)) {
                    value = self.fields[name].onSetText(value);
                }
                self._private.setFieldValue(name, value);
            }
        };
        

        this.expandFields(fields);
        this.refresh();
    }
    refresh() {
        console.log("refresh");
        var self = this;
        this._private.index = -1;
        var d = this.data;
        if (isDef(this.filter)) {
            /*
                filter aceita uma funcao do usuario ou um objeto
                exemplos: 
                    {codigo: "10"}
                    {codigo: "10", nome: "jose"}
            */
            if (isFunction(this.filter)) {
                d = d.filter(this.filter, this);
            } else
                if (isObject(this.filter)) {
                    d = d.filter(function (item) {
                        for (var name in this.filter) {
                            if (this.filter[name] !== item[name]) {
                                return false;
                            }
                        }
                        return true;
                    }, this)
                } else {
                    //tipo de filtro nao implementado
                }
        }
        if (isDef(this.sort)) {
            /*
                sort aceita uma funcao do usuario ou um objeto {name: "nome", reverse: false, emptyFirst: false}
            */
            if (isFunction(this.sort)) {
                d = d.sort(this.sort);
            } else
                if (isObject(this.sort)) {
                    d = d.sort(function (a, b) {
                        var name = self.sort.name;
                        var inverse = self.sort.inverse || false;
                        var emptyFirst = self.sort.emptyFirst || false;
                        return compareValues({ v1: a[name], v2: b[name], inverse: inverse, emptyFirst: emptyFirst });
                    }, this)
                } else {
                    console.log("Error: Sort type not supported");
                }
        }
        this._private.rows = d;
        if (this.rows.length > 0) this._private.index = 0;
    }
    
    //funcoes
    expandFields(fields) {
        var self = this;
        var obj = fields;
        //converter definicao de fields de array para objeto
        if (isArray(fields)) {
            obj = {};
            fields.forEach(function (c, i, a) {
                var name;
                if (isString(c)) {
                    name = c;
                    obj[name] = {};
                } else {
                    name = c.name;
                    delete c.name;
                    obj[name] = c;
                }
                obj[name].title = obj[name].title || name;
            }, this);
        }
        this._private.fields = obj;
        //criar o cursor
        this.cursor = {};
        for (var name in this.fields) {
            var fld = (this.cursor[name] = {});
            Object.defineProperty(fld, "value", {
                get: function () {
                    return self._private.getFieldValue(name);
                },
                set: function (v) {
                    self._private.setFieldValue(name, v);
                },
                enumerable: true
            });
            Object.defineProperty(fld, "text", {
                get: function () {
                    return self._private.getFieldText(name);
                },
                set: function (v) {
                    self._private.getFieldText(name, v);
                },
                enumerable: true
            });
        };
    }
    //propriedades
    get data() {
        return this._private.data;
    }
    set data(v) {
        this._private.data = v;
        this.refresh();
    }
    get fields() {
        return this._private.fields;
    }
    set fields(list) {
        //expandir uma definicao de fields minificada em array para um formato FieldModel completo
        var self = this;
        var obj = {};
        list.forEach(function (c, i, a) {
            var name;
            if (isString(c)) {
                name = c;
                obj[name] = new FieldModel({name});
            } else {
                
                name = c.name;
                delete c.name;
                obj[name] = new FieldModel({});
            }
            obj[name].title = obj[name].title || name;
        }, this);
        
        this._private.fields = obj;
        //criar o cursor
        this.cursor = {};
        for (var name in this.fields) {
            var fld = (this.cursor[name] = {});
            Object.defineProperty(fld, "value", {
                get: function () {
                    return self._private.getFieldValue(name);
                },
                set: function (v) {
                    self._private.setFieldValue(name, v);
                },
                enumerable: true
            });
            Object.defineProperty(fld, "text", {
                get: function () {
                    return self._private.getFieldText(name);
                },
                set: function (v) {
                    self._private.getFieldText(name, v);
                },
                enumerable: true
            });
        };
        this.defineFields(v);
        this.refresh();
    }
    get filter() {
        return this._private.filter;
    }
    set filter(v) {
        this._private.filter = v;
        this.refresh();
    }
    get sort() {
        return this._private.sort;
    }
    set sort(v) {
        this._private.sort = v;
        this.refresh();
    }
    get rows() {
        return this._private.rows;
    }
    get index() {
        return this._private.index;
    }

}



console.log("start");
setTimeout(function () {
    var el = document.createTextNode("Ola que tal!");
    document.body.appendChild(el);
}, 1000);



var lista = [{ codigo: 1, nome: "jose", idade: 21 }, { codigo: 2, nome: "pedro", idade: 13 }, { codigo: 3, nome: "joao" }, { codigo: 4, nome: "ademar", idade: 33 }, { codigo: 5, nome: "zoio" }, { codigo: 6, nome: "zulu", idade: null }];
console.log(lista);

var m = lista.map(function (item, index, arr) {
    if (item.codigo !== 2) return item;
})

console.log(m);

var m2 = lista.map(function (item, index, arr) {
    if (item.codigo !== 2) return { codigo: item.codigo, nome: item.nome };
})

console.log(m2);

var f1 = lista.filter(function (item, index, arr) {
    return (item.codigo !== 2);
})

console.log(f1);

var s1 = lista.sort(function (a, b) {
    if (a.nome > b.nome) { return 1 } else { return -1 }
})

console.log(s1);

var s2 = lista.sort(function (a, b) {
    if (a.nome < b.nome) { return 1 } else { return -1 }
})

console.log(s2);

var d = new DataSet({
    data: lista,
    fields: [
        "codigo",
        "nome",
        "idade",
        {
            name: "dobro_idade",
            onGetValue:
                function (v) {
                    return v * 2;
                }

        }
    ],
    sort: { name: "nome" },
    filter: function (item) { return (item.idade > 15) }
})

console.log(JSON.stringify(d));

