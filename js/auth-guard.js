/* CREATEXODUS — Auth Guard
   Redirects to main page if not authenticated */
(function(){
  if (sessionStorage.getItem('cx_auth') !== '1') {
    var p = window.location.pathname.toLowerCase();
    window.location.href = (p.indexOf('/work/') !== -1)
      ? '../index.html'
      : 'index.html';
  }
})();
