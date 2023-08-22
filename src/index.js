import { cnpj, cpf } from "cpf-cnpj-validator";
import { createReadStream } from "fs";
import csvParser from "csv-parser";
//Array com as informações sem tratamento.
const unformatedData = [];

//Validação de CPF ou CNPJ
const formatAndCheckDoc = (doc) => {
  if (cnpj.isValid(doc)) {
    return cnpj.format(doc);
  } else if (cpf.isValid(doc)) {
    return cpf.format(doc);
  } else {
    return "Documento inválido.";
  }
};
//Conversão de Datas para o Tipo Date
const formatDate = (dateString) => {
  const [year, month, day] = [0, 4, 6].map((i) =>
    parseInt(dateString.substring(i, i + 2))
  );
  return new Date(year, month - 1, day).toLocaleDateString("pt-br");
};
//Conversão de Dados para Moeda Real Brasileira
const formatCurrency = (money) => {
  const options = {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  };
  return new Intl.NumberFormat("pt-BR", options).format(money);
};
//Validação de Valor Total e Prestações
const validateInstallment = (installment) => {
  if (installment.vlTotal / installment.qtPrestacoes === installment.vlPresta) {
    return true;
  } else {
    return false;
  }
};
//Remover as chaves já tratadas.
const sanitizeData = (object) => {
  const keysToRemove = [
    "vlTotal",
    "vlPresta",
    "vlMora",
    "vlMulta",
    "vlOutAcr",
    "vlIof",
    "vlDescon",
    "vlAtual",
    "nrCpfCnpj",
    "dtContrato",
    "dtVctPre",
  ];
  const newObject = { ...object };
  keysToRemove.forEach((key) => delete newObject[key]);
  return newObject;
};
//Contruir o objeto
const buildData = () => {
  return unformatedData.map((reg) => {
    return {
      vlTotal: formatCurrency(reg.vlTotal),
      vlPresta: formatCurrency(reg.vlPresta),
      vlMora: formatCurrency(reg.vlMora),
      vlMulta: formatCurrency(reg.vlMulta),
      vlOutAcr: formatCurrency(reg.vlOutAcr),
      vlIof: formatCurrency(reg.vlIof),
      vlDescon: formatCurrency(reg.vlDescon),
      vlAtual: formatCurrency(reg.vlAtual),
      nrCpfCnpj: formatAndCheckDoc(reg.nrCpfCnpj),
      dtContrato: formatDate(reg.dtContrato),
      dtVctPre: formatDate(reg.dtVctPre),
      ...sanitizeData(reg),
      installmentTest: validateInstallment(reg),
    };
  });
};
//Validar as informações
const validateData = () => {
  const docTest = buildData().filter(
    (reg) => reg.nrCpfCnpj !== "Documento inválido."
  );
  const installmentsTest = docTest.filter(
    (installment) => installment.installmentTest === true
  );
  if (installmentsTest.length > 0) {
    console.log(installmentsTest);
  } else {
    console.log("Sem dados válidos");
  }
};

// Manipulação de Dados de CSV e Conversão para Array
createReadStream("./data.csv")
  .pipe(csvParser())
  .on("data", (data) => {
    unformatedData.push(data);
  })
  .on("end", () => {
    validateData();
  });
