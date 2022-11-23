function addToCart(proId) {
    $.ajax({
      url: '/add-to-cart/' + proId,
      method: "get",
      success: (response) => {
        if (response.status == "add") {
          let count = $("#cart-count").html();
          count = parseInt(count) + 1;
          $("#cart-count").html(count);
          Swal.fire({
            icon: "success",
            title: "Item added to Cart",
            showConfirmButton: false,
            timer: 1000,
          });
        } else if (response.noStock) {
          Swal.fire({
            icon: "error",
            title: "Oops..!",
            text: "Out Of Stock!",
            showConfirmButton: false,
            timer: 1000,
          });
        } else {
          location.href = "/login";
        }
      },
    });
  }
  

function addToWishlist(proId){
    $.ajax({
        url:'/add-to-wishlist/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count = $('#wishlist-count').html()
                count = parseInt(count) + 1
                $("#wishlist-count").html(count)
                Swal.fire({
                icon: 'success',
                title: 'Item added to wishlist',
                showConfirmButton: false,
                timer: 1500
                })
                document.getElementById(proId).style.color="red";
            }else{
                Swal.fire({
                icon: 'success',
                title: 'Item Removed in wishlist',
                showConfirmButton: false,
                timer: 1500
                })
                document.getElementById(proId).style.color="grey";
            }
        }
    
    })
    }
