const Discord = require('discord.js');
const axios = require('axios');
const config = require('./config.json');
const questions = require('../questions.json');
const client = new Discord.Client();

var activeChannels = {};

client.once('ready', () => {
  console.log('Ready!');
});

client.on('message', message => {
  if (message.content === config.prefix + 'start') {
    message.channel.send("Starting trivia! Type `?stop` to stop.");

    getQuestion(message.channel);
    const interval = setInterval(
      function () { getQuestion(message.channel) },
      config.interval_in_seconds * 1000
    );

    activeChannels[message.channel.id] = interval;
    console.log(`Starting trivia on channel #${message.channel.id}`);
  }

  else if (message.content === config.prefix + 'stop') {
    if (activeChannels[message.channel.id]) {
      message.channel.send("Stopping trivia. Type `?start` to start again.");

      clearInterval(activeChannels[message.channel.id]);
      activeChannels[message.channel.id] = null;
      console.log(`Stopping trivia on channel #${message.channel.id}`);
    } else {
      message.channel.send("I'm not running yet! Type `?start` to start.");
    }
  }
});

function getQuestion(channel) {
  const random = Math.floor(Math.random() * questions.length)
  var question = questions[random];

  sendQuestion(channel, question);
  console.log("Asking question: ", question);
}

function sendQuestion(channel, question) {
  const filter = response => {
    const guess = response.content.toLowerCase();
    const answer = cleanAnswer(question.answer);
    return guess.includes(answer);
  };

  channel.send(formatQuestion(question)).then(() => {
    channel.awaitMessages(filter, { max: 1, time: (config.interval_in_seconds - 1) * 1000, errors: ['time'] })
      .then(collected => {
        if (activeChannels[channel.id]) {
          channel.send(formatCorrectAnswer(collected.first().author, question.answer));
        }
      })
      .catch(collected => {
        if (activeChannels[channel.id]) {
          channel.send(formatNoAnswer(question.answer));
        }
      });
  });
}

function cleanAnswer(answer) {
  var words = ["of", "the", "in", "on", "at", "to", "a", "is", "their", "was", "and"];
  var wordRegex = new RegExp('\\b(' + words.join('|') + ')\\b', 'g');
  var charRegex = new RegExp('[^0-9a-zA-Z ]+', 'g');
  var spaceRegex = new RegExp('  +', 'g');
  return (answer || '')
    .replace(wordRegex, '')
    .replace(charRegex, '')
    .replace(spaceRegex, ' ')
    .toLowerCase().trim();
}

function formatQuestion(question) {
  return `
-----
Category: *${question.category} (${question.value})*
:thinking: **${question.question.substring(1, question.question.length - 1)}**
-----
`
}

function formatCorrectAnswer(author, answer) {
  return `
:partying_face: ${author} got the correct answer! The answer was *${answer}*.
`
}

function formatNoAnswer(answer) {
  return `
:confounded: Nobody was correct! The answer was *${answer}*.
`
}

client.login(config.token);