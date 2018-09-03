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

function parseIntDef(v, d) {
    v = parseInt(v);
    if (!isNumber(v)) v = d;
    return v;
}

function parseFloatDef(v, d) {
    v = parseFloat(v);
    if (!isNumber(v)) v = d;
    return v;
}

const StringField = {
    onSetValue: 
        function (fieldModel, value) {
            if (isDef(value)) {
                value = String(value);
            } else {
                value = null;
                if (fieldModel.nulls === false) value = ""; 
            }
            if (isFunction(fieldModel.onSetValue)) value = FieldModel.onSetValue(FieldModel, value);
            return value;
        }
}

const IntegerField = {
    onSetValue: 
        function (fieldModel, value) {
            value = parseIntDef(value, fieldModel.nulls === false ? 0 : null);
            if (isFunction(fieldModel.onSetValue)) value = FieldModel.onSetValue(FieldModel, value);
            return value;
        }
}

const FloatField = {
    onSetValue: 
        function (fieldModel, value) {
            value = parseFloatDef(value, fieldModel.nulls === false ? 0 : null);
            if (isFunction(fieldModel.onSetValue)) value = FieldModel.onSetValue(FieldModel, value);
            return value;
        }
}


class DataSet {
    constructor({ data, fieldDefs }) {
        var self = this;
        this._private = {
            data, 
            fieldDefs
        };
        this._private.getFieldValue = function (name) {
        }
        this._private.setFieldValue = function (name, value) {
        }
        this._private.getFieldText = function (name) {
        }
        this._private.setFieldText = function (name, text) {
        }
        this.refresh();
    }
    refresh() {
        console.log("refresh");
        var self = this;
        //converter fieldDefs minificado do formato array para objeto
        if (isArray(self.fieldDefs)) {
            var arr = self.FieldDefs;
            self.fieldDefs = {};
            arr.forEach(function (c, i, a) {
                var name;
                if (isString(c)) {
                    name = c;
                    self.FieldDefs[name] = {"name": name};
                } else {
                    name = c.name;
                    self.FieldDefs[c.name] = c;
                }
                self.FieldDefs[name].title = self.FieldDefs[name].title || name;
            });
        }
        //criar o cursor
        this.cursor = {};
        for (var name in self.fieldDefs) {
            var field = (this.cursor[name] = {});
            Object.defineProperty.call(this, field, "value", {
                get: function () {
                    return this._private.getFieldValue.call(this, name);
                },
                set: function (v) {
                    this._private.setFieldValue.call(this, name, v);
                },
                enumerable: true
            });
            Object.defineProperty.call(this, field, "text", {
                get: function () {
                    return this._private.getFieldText.call(this, name);
                },
                set: function (v) {
                    this._private.getFieldText.call(this, name, v);
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
    get fieldDefs() {
        return this._private.fieldDefs;
    }
    set fieldDefs(v) {
        this._private.fieldDefs = v;
        this.refresh();
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
            type: IntegerField,
            onGetValue:
                function (f, v) {
                    return v * 2;
                }

        }
    ],
    sort: { name: "nome" },
    filter: function (item) { return (item.idade > 15) }
})

console.log(JSON.stringify(d));


