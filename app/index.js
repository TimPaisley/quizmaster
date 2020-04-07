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

    activeChannels[message.channel.id] = { interval: interval, scores: {} };
    console.log(`Starting trivia on channel #${message.channel.id}`);
  }

  else if (message.content === config.prefix + 'stop') {
    if (activeChannels[message.channel.id]) {
      message.channel.send("Stopping trivia. Type `?start` to start again.");

      clearInterval(activeChannels[message.channel.id].interval);
      activeChannels[message.channel.id] = null;
      console.log(`Stopping trivia on channel #${message.channel.id}`);
    } else {
      message.channel.send("I'm not running yet! Type `?start` to start.");
    }
  }

  else if (message.content == config.prefix + 'score') {
    if (activeChannels[message.channel.id]) {
      const output = formatScores(activeChannels[message.channel.id].scores)
      message.channel.send(output);
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
    const guess = cleanAnswer(response.content);
    const answer = cleanAnswer(question.answer);
    return guess.includes(answer);
  };

  channel.send(formatQuestion(question)).then(() => {
    channel.awaitMessages(filter, { max: 1, time: (config.interval_in_seconds - 1) * 1000, errors: ['time'] })
      .then(collected => {
        if (activeChannels[channel.id].interval) {
          const user = collected.first().author;
          channel.send(formatCorrectAnswer(user, question.answer));

          if (isNaN(activeChannels[channel.id].scores[user])) { activeChannels[channel.id].scores[user] = 0; }
          activeChannels[channel.id].scores[user] += cleanPoints(question.value);
        }
      })
      .catch(collected => {
        if (activeChannels[channel.id].interval) {
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

function cleanPoints(points) {
  clean = points.replace('$', '').replace(',', '');
  parsed = parseInt(clean);

  if (isNaN(parsed)) { return 100; }
  return parsed;
}

function formatScores(scores) {
  var sortable = [];
  for (var user in scores) {
    sortable.push([user, scores[user]])
  }

  sortable.sort(function (a, b) {
    return b[1] - a[1];
  });

  return `
----
Top 5:
1. ${(sortable[0] || []).join(", $")}
2. ${(sortable[1] || []).join(", $")}
3. ${(sortable[2] || []).join(", $")}
4. ${(sortable[3] || []).join(", $")}
5. ${(sortable[4] || []).join(", $")}
----
`
}

function formatQuestion(question) {
  return `
-----
Category: *${question.category} (${question.value || "$100"})*
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