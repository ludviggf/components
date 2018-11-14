class Tag {
    constructor (tag, ...args) {
        this.tag = tag;
        this.element = document.createElement(this.tag);
        this.element.__component__ = this;
        args.forEach(e => {
            if (e instanceof Tag) {
                this.add(e);
            } else
            if (typeof e == "object") {
                this.attr(e);
            } else
            if (typeof e == "string") {
                this.text(e);
            }
        });
    }
    attr(obj) {
        for (let k in obj) {
            if (typeof obj[k] == "boolean") {
                if (obj[k]) {
                    this.element[k] = obj[k];
                } else {
                    this.element.removeAttribute(k);    
                }
            } else {
                if (obj[k] !== undefined) {
                    this.element.setAttribute(k, obj[k]);
                } else {
                    this.element.removeAttribute(k);
                }
            }                       
        }
        return this;
    }
    add(...args) {
        args.forEach(function(e) {
            this.element.appendChild(e.element);
        });
        return this;
    }
    on(type, listner) {
        this.element.addEventListener(type, listner);
        return this;
    }
    text(txt) {
        this.element.textContent = txt;
    }
}

class Div extends Component {
    constructor(...args) {
        super("div", ...args);
    }
}

class Img extends Component {
    constructor(...args) {
        super("img", ...args);
    }
}

class Button extends Component {
    constructor(caption, ...args) {
        super("button", ...args);
        this.element.textContent = caption;
    }
}

class Input extends Component {
    constructor(...args) {
        super("input", ...args);
    }
}

class InputText extends Component {
    constructor(...args) {
        super("input", {type: "text"}, ...args);
    }
}

class Label extends Component {
    constructor(caption, ...args) {
        super("label", caption, ...args);
    }
}
