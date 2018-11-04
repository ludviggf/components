
class FieldFormat {
    constructor({onGetValue = undefined, onSetValue = undefined}) {
        this.onGetValue = onGetValue;
        this.onSetValue = onSetValue;
        if (!this.onGetValue) {this.onGetValue = this.getValue}
        if (!this.onSetValue) {this.onSetValue = this.setValue}
    }
    getValue(value, fieldName, dataSet) {
        return value;
    }
    setValue(value, fieldName, dataSet) {
        return value;
    }
}

class DataSet {
    constructor({data = [], fields = []}) {
        this._private = {
            data, 
            fields
        };
        this.refresh();
    }
    refresh() {
        if ((this._private.fields.length == 0) && (this._private.data.length > 0)) {
            for (var k in this._private.data[0]) {
                this._private.fields.push({name: k});
            }
        }
        this._private.cursor = {};
        let self = this;
        this._private.fields.forEach(function(f, i, a) {
            Object.defineProperty(self._private.cursor, f.name, {
                get: function() { 
                    let v = self.getRawValue(f.name);
                    if ((f.format) && (f.format.onGetValue)) {
                        v = f.format.onGetValue(v, f.name, self);
                    }
                    return v;
                },
                set: function(v) {
                    if ((f.format) && (f.format.onGetValue)) {
                        v = f.format.onSetValue(v, f.name, self);
                    }
                    self.setRawValue(f.name, v);
                },
                enumerable: true
            });
        });
        this.index = 0;    
    }
    get cursor() {
        return this._private.cursor;
    }
    getRawValue(fieldName) {
        return this._private.data[this._private.index][fieldName];
    }
    setRawValue(fieldName, value) {
        this._private.data[this._private.index][fieldName] = value;
    }
    get count() {
        return this._private.data.length;
    }
    get index() {
        return this._private.index;
    }
    set index(value) {
        if (value < 0) { value = 0; }
        if (value > (this.count - 1)) { value = this.count - 1; }
        this._private.index = value;
    }
    next() {
        this.index = this.index + 1;
    }
    prior() {
        this.index = this.index - 1;
    }
    last() {
        this.index = this.count - 1;
    }
    first() {
        this.index = 0;
    }
    get isEmpty() {
        return this.count == 0;
    }
}