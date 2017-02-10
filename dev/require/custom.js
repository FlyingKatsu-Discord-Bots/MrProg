var CUSTOM = {
  Customization: function( input ) {
    var input = input || {};
    this.name = input.name || null;
    this.img = input.img || null;
    this.color = input.color || null;
    this.capacity = input.capacity || null;
    this.alignment = input.alignment || null;
    this.personality = input.personality || null;
    this.modifiers = input.modifiers || new CUSTOM.Modifiers();
    this.phrases = input.phrases || null;
  },

  Modifiers: function( input ) {
    var input = input || {};
    this.greeting = input.greeting || { mod: null, dialogue: new CUSTOM.Dialogue() };
    this.feeling = input.feeling || { mod: null, dialogue: new CUSTOM.Dialogue() };
    this.netalert = input.netalert || { mod: null, dialogue: new CUSTOM.Dialogue() };
    this.herosuccess = input.herosuccess || { mod: null, dialogue: new CUSTOM.Dialogue() };
    this.herofailure = input.herofailure || { mod: null, dialogue: new CUSTOM.Dialogue() };
    this.accepts = input.accepts || { mod: null, dialogue: new CUSTOM.Dialogue() };
    this.declines = input.declines || { mod: null, dialogue: new CUSTOM.Dialogue() };
    this.wins = input.wins || { mod: null, dialogue: new CUSTOM.Dialogue() };
    this.loses = input.loses || { mod: null, dialogue: new CUSTOM.Dialogue() };
    this.battles = input.battles || { mod: null, dialogue: new CUSTOM.Dialogue() };
    this.cheats = input.cheats || { mod: null, dialogue: new CUSTOM.Dialogue() };
    this.bails = input.bails || { mod: null, dialogue: new CUSTOM.Dialogue() };
    this.confused = input.confused || { mod: null, dialogue: new CUSTOM.Dialogue() };
    this.fakenod = input.fakenod || { mod: null, dialogue: new CUSTOM.Dialogue() };
    this.comfort = input.comfort || { mod: null, dialogue: new CUSTOM.Dialogue() };
    this.customized = input.customized || { mod: null, dialogue: new CUSTOM.Dialogue() };
    this.stats = input.stats || { mod: null, dialogue: new CUSTOM.Dialogue() };
  },

  Dialogue: function( input ) {
    var input = input || {};
    this.happy = input.happy || null;
    this.content = input.content || null;
    this.okay = input.okay || null;
    this.withdrawn = input.withdrawn || null;
    this.upset = input.upset || null;
  },
  
  replaceTextVar: function( owner, user, text ) {
    return text.replace(/@Owner/ig, owner.toString()).replace(/@User/ig, user.toString());
  }
  
};

if (Object.freeze) Object.freeze(CUSTOM);
module.exports = CUSTOM;