function unwrap(appMessage){

  var appMessageObject = {
    messageId: appMessage.slice(0,2),
    payload: appMessage.slice(2)
  };

  return appMessageObject;
}

module.exports = {
  unwrap: unwrap
};