
class mae {
    fala() {
        console.log("mae falando")
    }
}

class filha extends mae {
    fala() {
        console.log("filha falando")
        super.fala();
    }
}

class FormatoCodigo extends FieldFormat {
    static onGetValue(value, fieldName, dataSet) {
        return value.toString().padStart(6, "0");
    }
    static get default () { return 0 }
}


var ds = new DataSet({
    fields: [
        {name: "codigo",  format: FormatoCodigo}, 
        {name: "nome", default: ""},
        "idade"
    ],
    data: [
        {codigo: 1, nome: "Joao", idade: 30}, 
        {codigo: 2, nome: "Pedro", idade: 40}
    ]
});
console.log(ds);


/*
//definir fields com array
fields: [{name: "codigo",  format: FormatoCodigo}, "nome"]
//definir fields com objeto
fields: {codigo: {format: FormatoCodigo}, nome: {}}
*/