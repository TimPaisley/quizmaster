const Discord = require('discord.js');
const axios = require('axios');
const config = require('./config.json');
const questions = require('../questions.json');
const client = new Discord.Client();

var flow = null;
var previous_question = null;

client.once('ready', () => {
  console.log('Ready!');
  flow = null;
  previous_question = null;
});

client.on('message', message => {
	if (message.content === config.prefix + 'start') {
    message.channel.send('Starting trivia!');

    getQuestion(message.channel);
    flow = setInterval(
      function() { getQuestion(message.channel) },
      config.interval_in_seconds * 1000
    );
  }
  
  else if (message.content === config.prefix + 'stop') {
    message.channel.send('Stopping trivia.');
    clearInterval(flow);
    flow = null;
	}
});

function getQuestion (channel) {
  const random = Math.floor(Math.random() * questions.length)
  var question = questions[random];

  sendQuestion(channel, question);
  console.log ("Asking question: ", question);
}

function sendQuestion (channel, question) {
  const filter = response => {
    return response.content.toLowerCase().includes(question.answer.toLowerCase());
  };

  channel.send(formatQuestion(question)).then(() => {
    channel.awaitMessages(filter, { max: 1, time: (config.interval_in_seconds - 1) * 1000, errors: ['time'] })
      .then(collected => {
        channel.send(formatCorrectAnswer(collected.first().author, question.answer));
      })
      .catch(collected => {
        channel.send(formatNoAnswer(question.answer));
      });
  });
}

function formatQuestion (question) {
  return `
-----
Category: *${question.category} (${question.value})*
:thinking: **${question.question.substring(1, question.question.length - 1)}**
-----
`
}

function formatCorrectAnswer (author, answer) {
  return `
:partying_face: ${author} got the correct answer! The answer was *${answer}*.
`
}

function formatNoAnswer (answer) {
  return `
:confounded: Nobody was correct! The answer was *${answer}*.
`
}

client.login(config.token);