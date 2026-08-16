/*@3.ENDJ.1*/
window.GardenEndpoints = {
  /*@3.ENDJ.2*/
  ai: 'https://gardin-main.xxli50xx.workers.dev',

  /*@3.ENDJ.3*/
  push: 'https://garden-push.xxli50xx.workers.dev',

  /*@3.ENDJ.4*/
  sync: 'https://api.libbard.cc/v1/stage',

  /*@3.ENDJ.5*/
  publicData: 'https://api.libbard.cc/v1/stage',

  /*@3.ENDJ.6*/
  labs: 'https://labs.libbard.cc',

  /*@3.ENDJ.8*/
  telemetry: 'https://byte-telemetry.xxli50xx.workers.dev/t/b',
  
  googleClientId: '838935058358-3qst06d1o6acoocb4l2e9nk2d9ggk68i.apps.googleusercontent.com',
};

/*@3.ENDJ.7*/
(function () {
  var h = location.hostname;
  if (h !== 'localhost' && h !== '127.0.0.1' && h !== '[::1]' && h !== '::1') return;
  window.GardenEndpoints.sync = location.origin;
  window.GardenEndpoints.publicData = location.origin;
  /*@3.ENDJ.9*/
  window.GardenEndpoints.telemetry = '';
})();
