
class FieldFormat {
    static onGetValue(value, fieldName, dataSet) {
        return value;
    }
    static onSetValue(value, fieldName, dataSet) {
        return value;
    }
}

class DataSetState {
    static get EMPTY() { return "empty" }
    static get BROWSE() { return "browse" }
    static get EDIT() { return "edit" }
    static get INSERT() { return "insert" }
    static get POST() { return "post" }
    static get CANCEL() { return "cancel" }
}

class DataSet {
    constructor({data = [], fields = []}) {
        Object.defineProperty(this, "_private", {value: {}, enumerable: false});
        this.state = DataSetState.EMPTY;
        this.fields = fields;
        this.data = data;
    }
    get state() {
        return this._private.state;
    }
    set state(value) {
        if (value !== this.state) {
            let oldState = this.state;
            switch (value) {
                //limpar o dataSet
                case DataSetState.EMPTY:
                    this._private.state = DataSetState.EMPTY;
                    this._private.data = [];
                    this._private.index = -1;
                    this._private.cursor = {};
                break;
                //iniciar navegacao no dataset
                case DataSetState.BROWSE:
                    switch (this.state) {
                        case DataSetState.INSERT, DataSetState.EDIT:
                            this.state = DataSetState.POST;
                        break;
                        case DataSetState.EMPTY:
                            if (this.count > 0) {
                                this._private.state = DataSetState.BROWSE;
                                this.first();
                            }
                        break;
                    }
                break;
                //inserir um registro novo
                case DataSetState.INSERT:
                    this.state = DataSetState.BROWSE;
                    this._private.buffer = {};
                    for (var fieldName in this.fields) {
                        this._private.buffer[fieldName] = undefined;
                    }
                    this._private.buffer._updateState = DataSetState.INSERT;
                    this._private.state = DataSetState.INSERT;
                break;
                //editar um registro
                case DataSetState.EDIT:
                    this.state = DataSetState.BROWSE;
                    if (this.state == DataSetState.EMPTY) {
                        this.state = DataSetState.INSERT;
                    } else {
                        this._private.buffer = {};
                        Object.assign(this._private.buffer, this._private.data[this._private.index]);
                        if (!this._private.buffer._updateState) {
                            this._private.buffer._updateState = DataSetState.EDIT;
                            this._private.buffer._oldData = {};
                            Object.assign(this._private.buffer._oldData, this._private.data[this._private.index]);
                        }
                        this._private.state = DataSetState.EDIT;
                    }
                break;
                //gravar um registro em edicao ou insercao
                case DataSetState.POST:
                    switch (this.state) {
                        case DataSetState.INSERT:
                            this._private.data.push(this._private.buffer);
                            this._private.state = DataSetState.BROWSE;
                            this.last();
                        break;
                        case DataSetState.EDIT:
                            this._private.data[this.index] = this._private.buffer;
                            this._private.state = DataSetState.BROWSE;
                        break;
                    }
                break;
                //cancelar a inclusao/edicao de um registro
                case DataSetState.CANCEL:
                    if ((this.state == DataSetState.INSERT) && (this.state == DataSetState.EDIT)) {
                        this._private.state = DataSetState.BROWSE;
                    }
                break;
            }
            if (oldState !== this.state) {
                //evento
            }
        }
    }    
    get fields() {
        return this._private.fields;
    }
    set fields(value) {
        let self = this;
        this.state = DataSetState.EMPTY;
        value.forEach(function (field, i) {
            if (typeof field === 'string' || value instanceof String) {
                value[i] = {name: field};
            }    
        });
        this._private.fields = value;
        for (var fieldName in this._private.fields) {
            let field = self._private.fields[fieldName];
            field.name = fieldName;
            Object.defineProperty(self._private.cursor, fieldName, {
                get: function() { 
                    let v = self.getRawValue(field.name);
                    if ((field.format) && (field.format.onGetValue)) {
                        v = field.format.onGetValue(v, field.name, self);
                    }
                    if (field.onGetValue) {
                        v = field.onGetValue(v, field.name, self);
                    }
                    return v;
                },
                set: function(v) {
                    if ((field.format) && (field.format.onGetValue)) {
                        v = field.format.onSetValue(v, field.name, self);
                    }
                    if (field.onSetValue) {
                        v = field.onSetValue(v, field.name, self);
                    }
                    self.setRawValue(field.name, v);
                },
                enumerable: true
            });
        }
    }
    set data(value) {
        this.state = DataSetState.EMPTY;
        this._private.data = value;
        if ((!this.fields) && (this.count > 0)) {
            for (var k in this._private.data[0]) {
                this._private.fields.push({name: k});
            }
        }
        this.state = DataSetState.BROWSE;
    }
    get cursor() {
        if (this.state !== DataSetState.EMPTY) {
            return this._private.cursor;
        }
    }
    getRawValue(fieldName) {
        let v;
        switch (this.state) {
            case DataSetState.BROWSE:
                v = this._private.data[this._private.index][fieldName];
            break;
            case DataSetState.INSERT, DataSetState.EDIT:
                v = this._private.buffer[fieldName];
            break;
        }
        return v;
    }
    setRawValue(fieldName, value) {
        if ((this.state !== DataSetState.EDIT) && (this.state !== DataSetState.INSERT)) {
            this.edit();
        }
        this._private.buffer[fieldName] = value;
    }
    get count() {
        return this._private.data.length;
    }
    get index() {
        return this._private.index;
    }
    set index(value) {
        if (this.state !== DataSetState.EMPTY) {
            if (value < 0) { value = 0; }
            if (value > (this.count - 1)) { value = this.count - 1; }
            this.state = DataSetState.BROWSE;
            this._private.index = value;
        }
    }
    next() {
        this.index = this.index + 1;
        return this.index;
    }
    prior() {
        this.index = this.index - 1;
        return this.index;
    }
    last() {
        this.index = this.count - 1;
        return this.index;
    }
    first() {
        this.index = 0;
        return this.index;
    }
    edit() {
        this.state = DataSetState.EDIT;
        return this.state == DataSetState.EDIT;        
    }
    insert() {
        if (this.state in [DataSetState.BROWSE, DataSetState.EMPTY]) {
            this._private.buffer = {};
            this.fields.forEach(function(field) {
                var value = undefined;
                if (field.default) {
                    value = field.default;
                } else
                if ((field.format) || (field.format.default)) {
                    value = field.format.default;
                }
                this._private.buffer[field.name] = value;
            });
            this._private.buffer._updateState = DataSetState.INSERT;
            this._private.state = DataSetState.INSERT;
            return DataSetState.INSERT;
        }
    }
    post() {
        this.state = DataSetState.POST;
        return this.state == DataSetState.BROWSE;
    }
    cancel() {
        this.state = DataSetState.BROWSE;
        return this.state == DataSetState.BROWSE;
    }
}