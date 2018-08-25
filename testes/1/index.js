function isObject (obj) {
    return obj !== null && typeof obj === 'object'
}

function isFunction (obj) {
    return obj !== null && typeof obj === 'function'
}

function isUndef (v) {
    return v === undefined || v === null
}

function isDef (v) {
    return v !== undefined && v !== null
}

function isTrue (v) {
    return v === true
}

function isFalse (v) {
    return v === false
}

function isPrimitive (value) {
    return (
        typeof value === 'string' ||
        typeof value === 'number' ||
        // $flow-disable-line
        typeof value === 'symbol' ||
        typeof value === 'boolean'
    )
}

function isString (value) {
    return typeof value === 'string' || value instanceof String;
}

function isNumber (value) {
    return typeof value === 'number' && isFinite(value);
}

function isArray (value) {
    return Array.isArray(value);
}    
    
  
function mixin(source, target) {
    return Object.assign(target, source);
}

function compareValues({v1, v2, inverse = false, emptyFirst = false}) {
    var r = 0;
    if (v1 != v2) {
        if (isDef(v1) && isDef(v2)) {
            r = v1 < v2 ? -1 : 1; 
            if (inverse) r = r * (-1);
        } else {
            r = emptyFirst ? (isUndef(v1) ? -1 : 1) : (isUndef(v2) ? -1 : 1) ;
        }
        return r;
    } 
    return r;
}

class DataSource {
    constructor({data, cols, filter, sort}) {
        this._private = {data, cols, filter, sort};
        this.refresh();
    }
    refresh() {
        console.log("refresh");//, this.rows.length);
        var self = this;
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
                    for (var col in this.filter) {
                        if (this.filter[col] !== item[col]) {
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
                sort aceita uma funcao do usuario ou um objeto {col: "nome", inverse: false, emptyFirst: false}
            */
            if (isFunction(this.sort)) {
                d = d.sort(this.sort);
            } else
            if (isObject(this.sort)) {
                d = d.sort(function (a, b) {
                    var col = self.sort.col;
                    var inverse = self.sort.inverse || false;
                    var emptyFirst = self.sort.emptyFirst || false;
                    return compareValues({v1: a[col], v2: b[col], inverse: inverse, emptyFirst: emptyFirst});
                }, this)
            } else {
                console.log("Error: Sort type not supported");
            }
        }
        this._private.rows = d;
    }
    //propriedades
    get data() {
        return this._private.data;
    }
    set data(v) {
        this._private.data = v;
        this.refresh();
    }
    get cols() {
        return this._private.cols;
    }
    set cols(v) {
        this._private.cols = v;
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
    get index () {
        return this._index;
    }
    set index (v) {
        this._index = v;
    }

}



console.log("start");
setTimeout(function () {
    var el = document.createTextNode("Ola que tal!");
    document.body.appendChild(el);
}, 1000);



var lista = [{codigo:1, nome:"jose", idade: 21}, {codigo:2, nome:"pedro", idade: 13}, {codigo:3, nome:"joao"}, {codigo:4, nome:"ademar", idade:33}, {codigo:5, nome:"zoio"}, {codigo:6,nome:"zulu",idade:null}];
console.log(lista);

var m = lista.map(function (item, index, arr) {
    if (item.codigo !== 2) return item;
})

console.log(m);

var m2 = lista.map(function (item, index, arr) {
    if (item.codigo !== 2) return {codigo: item.codigo, nome: item.nome};
})

console.log(m2);

var f1 = lista.filter(function (item, index, arr) {
    return (item.codigo !== 2);
})

console.log(f1);

var s1 = lista.sort(function(a, b) {
    if (a.nome > b.nome) {return 1} else {return -1} 
})

console.log(s1);

var s2 = lista.sort(function(a, b) {
    if (a.nome < b.nome) {return 1} else {return -1} 
})

console.log(s2);

var d = new DataSource({
    data: lista,
    cols: [
        "codigo",
        "nome",
        "idade"
    ],
    sort: {col: "nome"},
    filter: function(item) { return (item.idade > 15)}
})

console.log(JSON.stringify(d));

