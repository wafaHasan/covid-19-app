'use strict';
require('dotenv').config();
const express = require('express')
const app = express();
const superagent = require('superagent')
const pg = require('pg')
const methodOverride = require('method-override')
const cors = require('cors')
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
const client = new pg.Client(process.env.DATABASE_URL);
const PORT = process.env.PORT || 7000;

app.get('/home',(req,res)=>{
    let url = 'https://api.covid19api.com/summary'
    superagent.get(url)
    .then(result=>{
        // console.log(result.body.Global.TotalConfirmed)
        // console.log(result.body.Global.TotalRecovered)
        res.render('home', {
           confirm: result.body.Global.TotalConfirmed,
           recovered: result.body.Global.TotalRecovered,
        })
    })
    .catch(err=>{
        res.render('err',{err:err})
    })
})

app.post('/formresult',(req,res)=>{
    let country = req.body.country;
    let date = req.body.date;
    let url = `https://api.covid19api.com/live/country/${country}/status/confirmed/date/${date}T13:13:30Z`;
    superagent.get(url)
    .then(result=>{
        console.log(result.body);
        let searchResult = result.body.map(data=>{
            return new Country (data);
        })
        res.render('formresult', {data: searchResult })
    })
    .catch(err=>{
        res.render('err',{err:err})
    })
})

app.get('/allcountries', (req,res)=>{
    let url = 'https://api.covid19api.com/summary';
    superagent.get(url)
    .then(result=>{
        // console.log(result.body.Countries)
        let allcountriesResult = result.body.Countries.map(data=>{
            return new All (data) 
        })
        res.render('allcountries', {data: allcountriesResult})
    })
})

app.post('/addtodb',(req,res)=>{
    let sql = 'insert into covido (country, confirmed,deathes,recovered, date) values ($1,$2,$3,$4,$5) returning *;'
    let {country, confirmed,deathes,recovered, date}=req.body;
    let safeVals = [country, confirmed,deathes,recovered, date]
    client.query(sql,safeVals)
    .then(()=>{
        res.redirect('/myrecords')
    })
    .catch(err=>{
        res.render('err',{err:err})
    })
})

app.get('/myrecords',(req,res)=>{
    let sql = 'select * from covido;'
    client.query(sql)
    .then(result=>{
        res.render('myrecords',{data: result.rows})
    })
    .catch(err=>{
        res.render('err',{err:err})
    })
})


app.get('/recordsdetails/:id',(req,res)=>{
    let sql = 'select * from covido where id=$1;'
    let safeVal= [req.params.id]
    client.query(sql,safeVal)
    .then((result)=>{
        res.render('recordsdetails', {data: result.rows})
    })
    .catch(err=>{
        res.render('err',{err:err})
    })
})

/* <form action="/update/<%=data.id%>?_method=put" method="POST"> */

app.put('/update/:id',(req,res)=>{
    let sql = 'update covido set country=$1,confirmed=$2,deathes=$3,recovered=$4,date=$5 where id =$6;'
    let {country, confirmed,deathes,recovered, date}=req.body;
    let safeVals = [country, confirmed,deathes,recovered, date ,req.params.id]
    client.query(sql,safeVals)
    .then(()=>{
        res.redirect(`/recordsdetails/${req.params.id}`)
    })
    .catch(err=>{
        res.render('err',{err:err})
    })
})
app.delete('/delete/:id',(req,res)=>{
    let sql = 'delete from covido where id=$1;'
    let safeVals = [req.params.id]
    client.query(sql,safeVals)
    .then(()=>{
        res.redirect(`/myrecords`)
    })
    .catch(err=>{
        res.render('err',{err:err})
    })
})


// (country, confirmed,deathes,recovered, date)
function Country(data){
    this.country = data.Country;
    this.confirmed = data.Confirmed;
    this.deathes = data.Deaths;
    this.recovered = data.Recovered;
    this.date = data.Date;
}

function All(data){
    this.country = data.Country;
    this.confirmed = data.TotalConfirmed;
    this.deathes = data.TotalDeaths;
    this.recovered = data.TotalRecovered;
    this.date = data.Date;
}

client.connect()
.then(()=>{
    app.listen(PORT,()=>{
        console.log(`up to ${PORT}`);
    })
})