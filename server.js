var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = process.env.PORT || 8000;

var app = express();


app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));


// var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect("mongodb://localhost/populatedb", { useNewUrlParser: true });



app.get("/scrape", function (req, res) {
    axios.get("https://www.nytimes.com/").then(function (response) {
        var $ = cheerio.load(response.data);

        $(".a").each(function (i, element) {

            var result = {};

            result.title = $(this)
            .children("h2")
            .text();
            result.link = $(this)
            .children("a")
            .attr("href");

            db.Article.create(result)
                .then(function (result) {
        
                    console.log(result);
                })
                .catch(function (err) {
        
                    console.log(err);
                });
        });

        res.send("Scrape Complete");
    });
});


app.get("/articles", function (req, res) {
    db.Article.find({})
        .then(function (result) {
            res.json(result);
        })
        .catch(function (err) {
            res.json(err);
        })
});

app.get("/articles/:id", function (req, res) {
    db.Article.findOne({_id: req.params.id})
        .populate("note")
        .then(function (result) {
            res.json(result);
        })
        .catch(function (err) {
            res.json(err)
        })

});

app.post("/articles/:id", function(req, res) {
    db.Note.create(req.body)
      .then(function(newNote) {
        return db.Article.findOneAndUpdate(
          { _id: req.params.id },
          {
            $set: { note: newNote._id}
          },
          { new: true }
        );
      })
      .then(function(result) {
        res.json(result);
      })
      .catch(function(err) {
        res.json(err);
      });
});

app.delete("/deletenote/:id", function (req, res) {
    Note.remove(req.body)
        .then(function (dbNote) {
            return db.Article.findOneAndRemove({ "_id": req.params.id }, { $pull: { note: dbNote._id } });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        })
});


app.listen(PORT, function () {
    console.log("App running on port: " + PORT);
});