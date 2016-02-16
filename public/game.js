$(document).ready(function(){
    window.addEventListener('deviceorientation', e => {
      if(e.gamma !== null){
          var results = [
            Math.sin(2*Math.PI*(e.gamma / 180)),
            Math.sin(2*Math.PI*(e.alpha / 360)),
            Math.sin(2*Math.PI*(e.beta / 360))
          ];
          alert('Fuck');
        $('li#response').prepend(`
          <l1>Hello</li>
          `);
      }
    })
});
