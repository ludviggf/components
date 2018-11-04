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


class DataSet {
    constructor({ data, fields }) {
        var self = this;
        this._private = {
            data, 
            fields
        };
        this.refresh();
    }
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
    set fields(v) {
        this._private.fields = v;
        this.refresh();
    }
    refresh() {

    }
}



console.log("start");
setTimeout(function () {
    var el = document.createTextNode("Ola que tal!");
    document.body.appendChild(el);
}, 1000);



var lista = [{ codigo: 1, nome: "jose", idade: 21 }, { codigo: 2, nome: "pedro", idade: 13 }, { codigo: 3, nome: "joao" }, { codigo: 4, nome: "ademar", idade: 33 }, { codigo: 5, nome: "zoio" }, { codigo: 6, nome: "zulu", idade: null }];
console.log(lista);

var TIdade = function (value, unMask) {
    if (!unMaks) { return parseIntDef(value, 0) } else { return value };
};

var d = new DataSet({
    data: lista,
    fields: [
        "codigo",
        "nome",
        {name: "idade", mask: TIdade},
        {
            name: "dobro_idade"
        }
    ]
})

console.log(JSON.stringify(d));


