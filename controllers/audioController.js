const gTTS = require("gtts");

// generate a audio file 
const generateAudio = (word) => {
  var gtts = new gTTS(word, "en");
  gtts.save("./public/audio.mp3", function (err, result) {
    if (err) {
      throw new Error(err);
    }
  });
};

module.exports = { generateAudio };
