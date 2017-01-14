var PARTNER = function(user, n, b, v) {
  this.owner = user;
  this.baseKey = b || 1;
  this.variantKey = v || 0;
  this.level = 0;
  this.xp = 0;
  this.mood = 1;
  this.numResets = 0;
  
  if (config.enforceSuffix && n && !n.includes(confix.nameExt) ) { n += config.nameExt; }
  this.custom = new Customization( { name: n } );

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
    if ( config.EnableOC && SERVER.channels.oc === channel && this.custom.img ) {
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
  this.getModifier = function( situation ) {
    return this.custom.modifiers[situation].mod || this.getVariant().custom.modifiers[situation].mod;
  };
  this.getDialogue = function( situation, feeling ) {
    return this.custom.modifiers[situation].dialogue[feeling] || this.getVariant().custom.modifiers[situation].dialogue[feeling];
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
  this.setModifier = function( situation, mod ) {
    this.custom.modifiers[situation].mod = mod;
  };
  this.setDialogue = function( situation, feeling, text ) {
    this.custom.modifiers[situation].dialogue[feeling] = text;
  };
};

if (Object.freeze) Object.freeze(PARTNER);
//module.exports = PARTNER;