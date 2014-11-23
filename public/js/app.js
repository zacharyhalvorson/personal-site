$('.m-scooch').scooch();

if ( $('.m-item:first-child' ).hasClass('m-active') ) {
    $('.m-scooch-controls [data-m-slide="prev"]').addClass('hide');
}

// Create array of images in carousel
var images = $('.m-item').map(function() {
     return this
}).get()

// Pseusocode
//
// when afterSlide fires
//
//     make sure to reevaluate the situation, adding buttons back that were previously removed
//
//     for image in images
//         if !image[i-1]
//             add hide class to previous button
//         if !image[i+1]
//             add hide class to next button
// 
