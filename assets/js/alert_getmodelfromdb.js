function onclick_get(){
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-danger'
      },
      buttonsStyling: false
    })

    swalWithBootstrapButtons.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, get it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        $('#table_main_data').html('');
        url = '/data/get';
        $.post(url, function( data ) {
          console.log(data);
          if(data.status === 'success') {
            let sentdata = data.data;
            let tabletag = $('#table_main_data');
            if(tabletag){
              let tableinnerhtml;
              sentdata.forEach(element => {
                let onerow = '<tr>'+
                '<td>' + element.name + '</td>'+
                '<td>' + element.date + '</td>'+
                '<td>' + element.time + '</td>'+
                '<td>' + element.mass + '</td>'+
                '<td>' + element.volume + '</td>'+
                '<td>'+
                '<div style="float:left">'+
                '<a href="/data/view/' + element._id + '" class="btn btn-primary btn-min-width mr-1 mb-1">View</a>' +	
                '</div>'+
                '</td>'+
                '</tr>';
                tableinnerhtml += onerow;
              });
              tabletag.html(tableinnerhtml);
            }
            swalWithBootstrapButtons.fire(
              'Got it!',
              'Your db is updated.',
              'success'
            );
            // location.reload();
          }else{
            $('#table_main_data').html('');
            swalWithBootstrapButtons.fire(
              'Failed it!',
              'We cannot access this database.',
              'error'
            );
          }
        });
      }
    });
  }



function init_socket(){
  //socket
  var socket = io();
  // socket.emit('broad message', 'Hello Hello hello');
  socket.on('broad message', function(msg) {
      // console.log(msg);
      location.reload();
  });
}

init_socket();