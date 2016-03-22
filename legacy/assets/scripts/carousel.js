$( '.m-scooch' ).scooch();

if ( $( '.m-item:first-child' ).hasClass( 'm-active' ) ) {

    $( '.m-scooch-controls [data-m-slide="prev"]' ).addClass( 'hide' );

};

$( '.m-scooch' ).on( 'afterSlide', function(e, previousSlide, nextSlide) {

    $( '.m-scooch-controls a' ).removeClass( 'hide' );

    if ( $('.m-item:first-child' ).hasClass( 'm-active' ) ) {

        $('.m-scooch-controls [data-m-slide="prev"]').addClass('hide');

    };

    if ( $('.m-item:last-child' ).hasClass( 'm-active' ) ) {

        $( '.m-scooch-controls [data-m-slide="next"]' ).addClass( 'hide' );

    };

});
