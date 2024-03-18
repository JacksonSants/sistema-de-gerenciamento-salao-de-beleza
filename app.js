console.log('Nosso primeiro projeto em node');

// Importação do módulo do express
const express = require('express');

//IMPORTANDO MODULO DE CONEXAO COM O BANCO
const conexao = require('./bd/conexao_mysql');


const fileupload = require('express-fileupload');

// Importação do express-handlebars e express-fileupload
const { engine } = require('express-handlebars');




const fs = require('fs');

const app = express();

// Habilitar o express-fileupload
app.use(fileupload());

// Adicionar o bootstrap
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));

// Adicionar o estilo.css
app.use('/css', express.static('./css'));


//REFERENCIAR PASTA DA IMNAGEM
app.use('/imagens', express.static('./imagens'));


// Configurar express-handlebars 
app.engine('handlebars', engine({
    helpers: {
        //FUNCAO AUXILIAR PARA VERIFICAR IGUALDADE
        condicionalIgualdade: function(parametro1, parametro2, options){
            return parametro1 === parametro2 ? options.fn(this) : options.inverse(this);
        }
    }
}));


app.set('view engine', 'handlebars');
app.set('views', './views');


// Rota para o formulário
app.get('/', function(req, res){
    res.render('formulario');
});

// Manipulação de conexão de dados via rotas
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// Rota principal
app.get('/', function(req, res){
    // SQL
    let sql = 'SELECT * FROM produto';

    // Executar comando SQL
    conexao.query(sql, function(erro, retorno){
        res.render('formulario', {produtos:retorno});
    });
});

// Rota principal contendo a situação
app.get('/:situacao', function(req, res){
    // SQL
    let sql = 'SELECT * FROM produto';

    // Executar comando SQL
    conexao.query(sql, function(erro, retorno){
        res.render('formulario', {produtos:retorno, situacao:req.params.situacao});
    });
});


//ROTA PARA PESQUISA
app.post('/pesquisa', function(req, res){
    //obter o termo pesquisadp
    let termo = req.body.termo;
    //sql
    let sql = `SELECT * FROM produto WHERE nome LIKE '%${termo}'`;

    //executar comando sql
    conexao.query(sql, function(erro, retorno){
        let semRegistros = retorno.length == 0 ? true:false;
        res.render('lista', {produto:retorno, semRegistros:semRegistros});
    });

    //servico
    //servico.pesquisa(req, res);
})

// Rota de cadastro
app.post('/cadastrar', function(req, res){
    try{
      // Obter os dados que serão utiliados para o cadastro
      let nome = req.body.nome;
      let valor = req.body.valor;
      let imagem = req.files.imagem.name;
      let categoria = req.body.categoria;
 
      // Validar o nome do produto e o valor
      if(nome == '' || valor == '' || isNaN(valor) || categoria == ''){
         res.redirect('/falhaCadastro');
      }else{
         // SQL
         let sql = `INSERT INTO produto (nome, valor, imagem, categoria) VALUES ('${nome}', ${valor}, '${imagem}', '${categoria}')`;
        
         // Executar comando SQL
         conexao.query(sql, function(erro, retorno){
             // Caso ocorra algum erro
             if(erro) throw erro;
 
             // Caso ocorra o cadastro
             req.files.imagem.mv(__dirname+'/imagens/'+req.files.imagem.name);
             console.log(retorno);
         });
 
         // Retornar para a rota principal
         res.redirect('/okCadastro');
      }
    }catch(erro){
     res.redirect('/falhaCadastro');
    }
 });

 app.post(`/cadastrarFuncionario`, function(req, res) {
    try {
        let nome = req.body.nome;
        let email = req.body.email;
        let celular = req.body.celular;
        let cpf = req.body.cpf;
        let dataContrato = req.body.dataContrato; // corrigido para pegar a data de contrato corretamente
        let ctps = req.body.ctps;

        // Verifica se algum campo está vazio ou se a data de contrato não é válida
        if (nome == '' || email == '' || celular == '' || cpf == '' || dataContrato == '' || ctps == '') {
            res.redirect('/falhaCadastro'); // Redireciona para a página de falha de cadastro
        } else {
            // Se todos os campos estiverem preenchidos e a data de contrato for válida, faz a inserção no banco de dados
            let sql = `INSERT INTO funcionario (nome, email, celular, cpf, dataContrato, ctps) VALUES ('${nome}', '${email}', '${celular}', '${cpf}', '${dataContrato}', '${ctps}')`;

            conexao.query(sql, (erro, retorno) => {
                if (erro) {
                    console.error('Erro ao executar a consulta SQL:', erro);
                    res.redirect('/falhaCadastro'); // Redireciona para a página de falha de cadastro em caso de erro
                    return;
                }
                console.log('Registro inserido com sucesso!');
                res.redirect('/sucessoCadastro'); // Redireciona para a página de sucesso de cadastro
            });
        }
    } catch (erro) {
        console.error('Erro ao cadastrar funcionário:', erro);
        res.redirect('/falhaCadastro');
    }
});



//REMOÇÃO
app.get('/remover/:codigo&:imagem', function(req, res){
    //TRAMANEWTO DE EXEÇÃO
    try{
        //SQL
        let sql = `DELETE FROM produto WHERE codigo = ${req.params.codigo}`;

        //EXECUTAR O COMANDO SQL
        conexao.query(sql, function(erro, retorno){
            //CASO FALHE O COMANDO SQL
            if(erro) throw erro;

            //CASO O SQL FUNCIONE
            fs.unlink(__dirname+'/imagens/'+req.params.imagem, (erro_imagem)=>{
                console.log('Falha ao remover imagem')
            });
        });

        //REDIRECIONAMENTO
        res.redirect('/okRemover');
    }catch(erro){
        res.redirect('/falhaRemover');
    }
});


//ROTA PARA REDIRECIONAR PARA O FORMULARIO DE EDIÇÃO
app.get('/formularioEditar/:codigo', function(req, res){

    //SQL
    let sql = `SELECT * FROM produto WHERE codigo = ${req.params.codigo}`;

    //EXECUTAR O COMANDO SQL
    conexao.query(sql, function(erro, retorno){
        //CASO HAJA FALHA NO COMANDO SQL
        if(erro) throw erro;

        //CASO CONSIGA EXECUTAR O COMANDO SQL
        res.render('formularioEditar', {produto:retorno[0]});
    });
});

//rotas para edicao

// Rota para redirecionar para o formulário de alteração/edição
app.get('/formularioEditar/:codigo', function(req, res){
   
    // SQL
    let sql = `SELECT * FROM produto WHERE codigo = ${req.params.codigo}`;

    // Executar o comando SQL
    conexao.query(sql, function(erro, retorno){
        // Caso haja falha no comando SQL
        if(erro) throw erro;

        // Caso consiga executar o comando SQL
        res.render('formularioEditar', {produto:retorno[0]});
    });

});

// Rota para editar produtos
app.post('/editar', function(req, res){

    // Obter os dados do formulário
    let nome = req.body.nome;
    let valor = req.body.valor;
    let codigo = req.body.codigo;
    let categoria = req.body.categoria;
    let nomeImagem = req.body.nomeImagem;

    // Validar nome do produto e valor
    if(nome == '' || valor == '' || isNaN(valor) || categoria == ''){
        res.redirect('/falhaEdicao');
    }else {

        // Definir o tipo de edição
        try{
            // Objeto de imagem
            let imagem = req.files.imagem;

            // SQL
            let sql = `UPDATE produto SET nome='${nome}', valor=${valor}, imagem='${imagem.name}', categoria='${categoria}' WHERE codigo=${codigo}`;
   
            // Executar comando SQL
            conexao.query(sql, function(erro, retorno){
                // Caso falhe o comando SQL
                if(erro) throw erro;

                // Remover imagem antiga
                fs.unlink(__dirname+'/imagens/'+nomeImagem, (erro_imagem)=>{
                    console.log('Falha ao remover a imagem.');
                });

                // Cadastrar nova imagem
                imagem.mv(__dirname+'/imagens/'+imagem.name);
            });
        }catch(erro){
           
            // SQL
            let sql = `UPDATE produto SET nome='${nome}', valor=${valor} WHERE codigo=${codigo}`;
       
            // Executar comando SQL
            conexao.query(sql, function(erro, retorno){
                // Caso falhe o comando SQL
                if(erro) throw erro;
            });
        }

        // Redirecionamento
        res.redirect('/okEdicao');
    }
});
// Função para realizar a pesquisa de produtos
function pesquisa(req, res){
    //obter o termo pesquisado
    let termo = req.body.termo;
    //sql
    let sql = `SELECT * FROM produto WHERE nome LIKE '%${termo}%'`;

    //executar o comando sql
    conexao.query(sql, function(erro, retorno){
        let semRegistros = retorno.length == 0 ? true:false;
        res.render('lista', {produto:retorno, semRegistros:semRegistros});
    });
}

//ROTA DE LISTAGEM
app.get('/listar/:categoria', function(req, res){
    listagemProdutos(req, res);
})

//FUNÇÃO PARA EXIBIR A LISTAGEM DE PRODUTOS
function listagemProdutos(req, res){
    //obter categoria
    let categoria = req.params.categoria;

    //sql
    let sql = '';
    if(categoria == 'todos'){
        sql = 'SELECT * FROM produto';
    }else{
        sql = `SELECT * FROM produto WHERE categoria = '${categoria}'`;
    }

    //EXECUTAR COMANDO SQL
    conexao.query(sql, function(erro, retorno){0
    res.render('lista', {produto:retorno});
   })
}



// Criar servidor web
app.listen(8080);