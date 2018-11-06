

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

const TipoCodigo = {
    onGetValue: function (value, fieldName, dataSet) {
        return (value || 0).toString().padStart(6, "0");
    },
    default: 0
}


var ds = new DataSet({
    fields: [
        {name: "codigo",  type: TipoCodigo}, 
        {name: "nome", default: ""},
        "idade"
    ],
    data: [
        {codigo: 1, nome: "Joao", idade: 30}, 
        {codigo: 2, nome: "Pedro", idade: 40}
    ]
});
console.log(ds);

