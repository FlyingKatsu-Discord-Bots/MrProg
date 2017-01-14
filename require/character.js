var CHARACTER = {
  proto: function() {
  this.owner = CLIENT.user;
  this.baseKey = 1;
  this.variantKey = 0;
  this.level = 0;
  this.xp = 0;
  this.mood = 1;
  this.numResets = 0;
  this.custom = new Customization();

  this.getEmbed = function(msg, situation) {
    return {
      author: this.getName(),
      description: FORMAT.injectVar( this.owner, msg.author,
          this.getDialogue(situation, ENUM.Feeling.properties[this.mood].id) ),
      thumbnail: this.getImg(msg.channel),
      color: this.getColor(),
    };
  };

  // Custom GETTERS
  this.getName = function() {
    return this.custom.name || this.getVariant().custom.name;
  };
  this.getBase = function() {
    return ENUM.Preset.properties[this.baseKey];
  };
  this.getVariant = function() {
    return this.getBase().variants[this.variantKey];
  };
  this.getImg = function(channel) {
    if ( CONFIG.EnableOC && SERVER.channels.oc === channel && this.custom.img ) {
      return this.custom.img;
    } else {
      return this.getVariant().custom.img;
    }
  };
  this.getColor = function() {
    return this.custom.color || this.getVariant().custom.color;
  };
  this.getCapacity = function() {
    return this.custom.capacity || this.getVariant().custom.capacity;
  };
  this.getAlignment = function() {
    return this.custom.alignment || this.getVariant().custom.alignment;
  };
  this.getPersonality = function() {
    return this.custom.personality || this.getVariant().custom.personality;
  };
  this.getModifier = function( situation ) {
    return this.custom.modifiers[situation].mod || 
      ENUM.Personality.properties[ENUM.Personality[this.getPersonality()]].modifiers[situation].mod;
  };
  this.getDialogue = function( situation, feeling ) {
    return this.custom.modifiers[situation].dialogue[feeling] || 
      ENUM.Personality.properties[ENUM.Personality[this.getPersonality()]].modifiers[situation].dialogue[feeling];
  };

  // Custom SETTERS
  this.setName = function( v ) {
    this.name = v;
  };
  this.setBase = function( v ) {
    this.custom.base = v;
  };
  this.setImg = function( v ) {
    this.custom.image = v;
  };
  this.setColor = function( v ) {
    this.custom.color = v;
  };
  this.setCapacity = function( v ) {
    this.custom.capacity = v;
  };
  this.setAlignment = function( v ) {
    this.custom.alignment = v;
  };
  this.setPersonality = function( v ) {
    this.custom.personality = v;
  };
  this.setModifier = function( situation, mod ) {
    this.custom.modifiers[situation].mod = mod;
  };
  this.setDialogue = function( situation, feeling, text ) {
    this.custom.modifiers[situation].dialogue[feeling] = text;
  };
},
  
  droppo: function() {
    let self = this;
    return (function(){
      this.prototype = self.proto;
      this.drop = [{ zenny: 50 }];
      // TODO: Add drop-related functions here to act as prototype
    })();
  },
  
  // TODO: Add other constructors here, for things like Viruses and Bosses
  enemy: function(name, base, variant, drop) {
    let self = this;
    return (function() {
      this.prototype = self.droppo;
      if (name) this.custom.name = name;
      if (base) this.baseKey = base;
      if (variant) this.variantKey = variant; // defaults to zero, so no need to check zero case
      if (drop && drop.length > 0) this.drop = drop;
    })();
  },
  
  partner: function(user, name, base, variant) {
    let self = this;
    return (function() {
      this.prototype = self.proto;
      this.owner = user;
      if (CONFIG.enforceSuffix && name && !name.includes(CONFIG.suffix) ) { name += CONFIG.suffix; }
      if (name) this.custom.name = name;
      if (base) this.baseKey = base;
      if (variant) this.variantKey = variant; // defaults to zero, so no need to check zero case
    })();
  }
    
  
}



if (Object.freeze) Object.freeze(CHARACTER);
//module.exports = CHARACTER;