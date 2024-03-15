// Importação do módulo mysql2
const mysql = require('mysql2');

// Configuração do banco de dados MySQL
const conexao = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'projeto'
});

// Teste de conexão
conexao.connect(function(erro) {
    if (erro) throw erro;
    console.log('Sua conexão foi realizada com sucesso!');
});

//EXPORTANDO O MODULO DE CONEXAO
module.exports=conexao;