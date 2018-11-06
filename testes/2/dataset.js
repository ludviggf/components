"use strict";

const EMPTY = "empty";
const BROWSE = "browse";
const EDIT = "edit";
const INSERT = "insert";
const DELETE = "delete";

const FieldType = {
    onGetValue: function (value, fieldName, dataSet) {
        return value;
    },
    onSetValue: function (value, fieldName, dataSet) {
        return value;
    },
    default: undefined
}

class DataSet {
    constructor({data = [], fields = []}) {
        Object.defineProperty(this, "_private", {
            value: {
                state: EMPTY,
                index: -1,
                cursor: {},
                data: [],
                fields: [],
                deleted: []
            }, 
            enumerable: false
        });
        this.fields = fields;
        this.data = data;
    }
    get state() {
        return this._private.state;
    }
    get fields() {
        return this._private.fields;
    }
    set fields(value) {
        this._private.state = EMPTY;
        value.forEach(function (field, i) {
            if (typeof field === 'string' || value instanceof String) {
                value[i] = {name: field};
            }
            if (field.type) {
                Object.assign(field, field.type);
            }
        });
        this._private.fields = value;
        this._private.fields.forEach(function (field) {
            let othis = this;
            Object.defineProperty(this._private.cursor, field.name, {
                get: function() { 
                    let v = othis.getRawValue(field.name);
                    if (field.onGetValue) {
                        v = field.onGetValue(v, field.name, othis);
                    }
                    return v;
                },
                set: function(v) {
                    if (field.onSetValue) {
                        v = field.onSetValue(v, field.name, othis);
                    }
                    othis.setRawValue(field.name, v);
                },
                enumerable: true
            });
        }, this);
    }
    get data() {
        return this._private.data;
    }
    set data(value) {
        this._private.state = EMPTY;
        this._private.index = -1;
        this._private.data = value;
        if (this.count > 0) {
            if (this.fields.length == 0) {
                let flds = {};
                for (var k in this._private.data[0]) {
                    flds.push({name: k});
                }
                this.fields = flds;
            }
            this._private.state = BROWSE;
            this._private.index = 0;
        }
    }
    get cursor() {
        if (this.state !== EMPTY) {
            return this._private.cursor;
        }
    }
    getRawValue(fieldName) {
        let v;
        if (this.state == BROWSE) {
                v = this._private.data[this._private.index][fieldName];
        } else 
        if ([INSERT, EDIT].includes(this.state)) {
            v = this._private.buffer[fieldName];
        }
        return v;
    }
    setRawValue(fieldName, value) {
        if ((this.state !== EDIT) && (this.state !== INSERT)) {
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
        if (this.state !== EMPTY) {
            if ([INSERT, EDIT].includes(this.state)) {
                this.post();
            }
            if (value < 0) { value = 0; }
            if (value > (this.count - 1)) { value = this.count - 1; }
            if (value !== this.index) {
                this._private.state = BROWSE;
                this._private.index = value;
                if (value == -1) {
                    this._private.state = EMPTY;
                }
            }    
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
        if (this.state == EMPTY) {
            this.insert();
        } else
        if (this.state == BROWSE) {
            this._private.buffer = {};
            Object.assign(this._private.buffer, this._private.data[this._private.index]);
            if (!this._private.buffer._updateState) {
                this._private.buffer._updateState = EDIT;
                this._private.buffer._oldData = {};
                Object.assign(this._private.buffer._oldData, this._private.data[this._private.index]);
            }
            this._private.state = EDIT;    
        }
    }
    insert() {
        if ([BROWSE, EMPTY].includes(this.state)) {
            this._private.buffer = {};
            this.fields.forEach(function(field) {
                var value = undefined;
                if (field.default !== undefined) {
                    value = field.default;
                }
                this._private.buffer[field.name] = value;
            }, this);
            this._private.buffer._updateState = INSERT;
            this._private.state = INSERT;
        }
    }
    delete() {
        if (this.state == BROWSE) {
            var buffer = this._private.data[this._private.index];
            if (buffer._updateState !== INSERT) {
                if (buffer._updateState == EDIT) {
                    buffer = buffer._oldData;
                }
                buffer._updateState = DELETE;
                this._private.deleted.push(buffer);
            }
            this._private.data.splice(this._private.index, 1);
            this.index = this.index;
        }
    }
    post() {
        if (this.state == INSERT) {
            this._private.data.push(this._private.buffer);
            this._private.state = BROWSE;
            this.last();
        } else
        if (this.state == EDIT) {
            this._private.data[this.index] = this._private.buffer;
            this._private.state = BROWSE;
        }
    }
    cancel() {
        if ([INSERT, EDIT].includes(this.state)) {
            this._private.state = BROWSE;
        }
    }
    get delta() {
        var a = this._private.data.filter(function (item) {
            return item._updateState;
        }, this);
        return a.concat(this._private.deleted);
    }
}