class Component {
    constructor (tag, ...args) {
        this.tag = tag;
        this.element = document.createElement(this.tag);
        this.element.__component__ = this;
        args.forEach(e => {
            if (Array.isArray(e)) {
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
    attr(attributes) {
        for (let k in attributes) {
            if (typeof attributes[k] == "boolean") {
                if (attributes[k]) {
                    this.element[k] = attributes[k];
                } else {
                    this.element.removeAttribute(k);    
                }
            } else {
                if (attributes[k] !== undefined) {
                    this.element.setAttribute(k, attributes[k]);
                } else {
                    this.element.removeAttribute(k);
                }
            }                       
        }
        return this;
    }
    add(components) {
        components.forEach(c => {
            this.element.appendChild(c.element);
            c.element.__component__.owner = this;
        });
        return this;
    }
    on(type, listner) {
        this.element.addEventListener(type, listner);
        return this;
    }
    text(textContent) {
        this.element.textContent = textContent;
    }
}

class Div extends Component {
    constructor() {
        super("div", ...arguments);
    }
}