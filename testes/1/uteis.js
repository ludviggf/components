
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

sort: { name: "nome" },
    filter: function (item) { return (item.idade > 15) }


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
