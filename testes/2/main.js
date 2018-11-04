
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

class FieldCodigo extends FieldFormat {
    getValue(value, fieldName, dataSet) {
        return value.toString().padStart(6, "0");
    }
}


var ds = new DataSet({
    fields: [
        {
            name: "codigo",
            format: new FieldCodigo({
               /* onGetValue: function (v, f, d) {
                    return parseInt(v) + 100;
                }*/
            })
        }, 
        {
            name: "nome"
        }],
    data: [{codigo: 1, nome: "Joao"}, {codigo: 2, nome: "Pedro"}]
});
console.log(ds);

