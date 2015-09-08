
/* jshint node: true */
"use strict";

var util = require('util');
var stream = require('stream');
var Readable = stream.Readable;

function BufferStream( source ) { 
  if ( ! Buffer.isBuffer( source ) ) { 
    throw( new Error( "Source must be a buffer." ) ); 
  } 
  // Super constructor.
  stream.Readable.call( this ); 
  this._source = source; 
  this._offset = 0;
  this._length = source.length; 
  // When the stream has ended, try to clean up the memory references.
  this.on( "end", this._destroy.bind(this) ); 
}
 
util.inherits( BufferStream, stream.Readable ); 
 
// I attempt to clean up variable references once the stream has been ended.
// --
// NOTE: I am not sure this is necessary. But, I'm trying to be more cognizant of memory
// usage since my Node.js apps will (eventually) never restart.
BufferStream.prototype._destroy = function() { 
  this._source = null;
  this._offset = null;
  this._length = null; 
};

// I read chunks from the source buffer into the underlying stream buffer.
// --
// NOTE: We can assume the size value will always be available since we are not
// altering the readable state options when initializing the Readable stream.
BufferStream.prototype._read = function( size ) { 
  // If we haven't reached the end of the source buffer, push the next chunk onto
  // the internal stream buffer.
  if ( this._offset < this._length ) { 
    this.push( this._source.slice( this._offset, ( this._offset + size ) ) ); 
    this._offset += size; 
  }
 
  // If we've consumed the entire source buffer, close the readable stream.
  if ( this._offset >= this._length ) { 
    this.push( null ); 
  } 
};

module.exports = BufferStream;

/// var _ = require('underscore');
/// var StringStream;
/// 
/// var hasProp = {}.hasOwnProperty;
/// 
/// StringStream = (function(superClass) {
///   function CustomStream(str) {
///     if ( ! _.isString(str) ) { 
///       throw( new Error( "Source must be a string." ) ); 
///     } 
///     superClass.call( this );
///     this.str = str;
///     this.writable = false;
///   }
///   
///   util.inherits(CustomStream, superClass);
/// 
///   CustomStream.prototype._read = function(size) {
///     this.push(this.str);
///     return this.push(null);
///   };
///   
///   return CustomStream;
/// 
/// })(Readable);
/// 
/// module.exports = StringStream;

