const express = require("express")
const app = express()
const path = require("path")
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysql = require('mysql');
const ejs = require('ejs');
const bodyParser = require('body-parser'); //post request data의 body로 부터 파라미터를 편리하게 추출
const dbConfig = require('./src/db/mysql.js');

/* 웹크롤링 */
const axios = require("axios");
const cheerio = require("cheerio");
const getHtml = async () => {
    try {
        return await axios.get("https://08genie.github.io/");
    } catch (error) {
        console.error(error);
    }
};


app.set('port', process.env.PORT || 5000);

app.use(express.static(path.join(__dirname, "src")))
app.use('/image', express.static('./uploads')); //이미지 업로드

var db = {
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database

};

var conn = mysql.createConnection(db);
conn.connect();

app.set('view engine', 'ejs'); //화면 engine을 ejs로 설정 (기본엔진)
app.set('views', './views'); //view 경로 설정
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: '!@#$%^&*', //세션 암호화
    store: new MySQLStore(db), //세션데이터를 저장하는 곳
    resave: false, //세션을 항상 저장할지 여부를 정하는값(false권장)
    saveUninitialized: false //초기화되지않은채 스토어에 저장 true
}));

app.get('/', async function (req, res) {

    let blog = await get_blog();

    res.render('index', { data: blog });


});


app.get('/trusee', async function (req, res) {

    let blog = await get_blog();

    res.render('trusee', { data: blog });

});


app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중')
})

async function get_blog(url, data) {
    //블로그 웹크롤링
    let blog = await getHtml()
        .then(html => {
            let ulList = [];
            const $ = cheerio.load(html.data);
            const $bodyList = $("#post-list").children("div");

            $bodyList.each(function (i, elem) {
                ulList[i] = {
                    title: $(this).find('h1 a').text(),
                    url: $(this).find('h1 a').attr('href'),
                    content: $(this).find('.post-content p').text(),
                    dateTime: $(this).find('.post-meta  .mr-auto em').text(),
                };
            });

            const data = ulList.filter(n => n.title);
            return data;
        })
        .then(blog_data => {
            return blog_data;
        });
    return blog;
};