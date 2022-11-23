var nameError = document.getElementById('name-error');
var priceError = document.getElementById('price-error');
var descriptionError = document.getElementById('description-error');
// var imageError = document.getElementsByClassName('image-error');
var imageError = document.getElementById('image-error');
var imageError2 = document.getElementById('image-error2');
var imageError3 = document.getElementById('image-error3');
var imageError4 = document.getElementById('image-error4');
// var passwordError = document.getElementById('password-error');

function validateName() {
    var name=document.getElementById('name').value.trim();  

    if (name.length==0) {
        nameError.innerHTML='Name is Required';
        nameError.style.color='red'
        return false;
    }

    if (!name.match(/^[A-Za-z ]*$/)){
        nameError.innerHTML='Write a FullName';
        nameError.style.color='red'
        return false;
    }
    if (name.length<2){
        nameError.innerHTML='Enter correct name';
        nameError.style.color='red'
        return false;
    }
    
    nameError.innerHTML='Name is valid';
    nameError.style.color='green'
    return true;
}
function validatePrice(){
    var price=document.getElementById('price').value.trim();  

    if (price.length==0) {
        priceError.innerHTML='Price is Required';
        priceError.style.color='red'
        return false;
    }
    if (!price.match(/^[0-9 ]*$/)){
        priceError.innerHTML='Enter numbers only';
        priceError.style.color='red'
        return false;
    }
    priceError.innerHTML='valid';
    priceError.style.color='green'
    return true;
}
function validateDescription(){
    var description=document.getElementById('description').value.trim();  

    if (description.length==0) {
        descriptionError.innerHTML='Description is Required';
        descriptionError.style.color='red'
        return false;
    }
    if (!description.match(/^[A-Za-z ]*$/)){
        descriptionError.innerHTML='Invalid text format';
        descriptionError.style.color='red'
        return false;
    }
    descriptionError.innerHTML='valid';
    descriptionError.style.color='green'
    return true;
}

function validateImage(){
        var images = document.getElementById('image1').value.trim();
    
        if (images.length==0){
            imageError.innerHTML='Select an image';
            imageError.style.color='red'
            return false;
        }
        imageError.innerHTML='valid';
        imageError.style.color='green'
        return true;
    
    }

    function validateImage2(){
        var images2 = document.getElementById('image2').value.trim();
    
        if (images2.length==0){
            imageError2.innerHTML='Select an image';
            imageError2.style.color='red'
            return false;
        }
        imageError2.innerHTML='valid';
        imageError2.style.color='green'
        return true;
    
    }

    function validateImage3(){
        var images3 = document.getElementById('image3').value.trim();
    
        if (images3.length==0){
            imageError3.innerHTML='Select an image';
            imageError3.style.color='red'
            return false;
        }
        imageError3.innerHTML='valid';
        imageError3.style.color='green'
        return true;
    
    }

    function validateImage4(){
        var images4 = document.getElementById('image4').value.trim();
    
        if (images4.length==0){
            imageError4.innerHTML='Select an image';
            imageError4.style.color='red'
            return false;
        }
        imageError4.innerHTML='valid';
        imageError4.style.color='green'
        return true;
    
    }



$(document).on("submit", "form", function (e) {

    validateName()
    validatePrice()
    validateDescription()
    validateImage()
    validateImage2()
    validateImage3()
    validateImage4()

    if (validateName() && validatePrice() && validateDescription() && validateImage() && validateImage2() && validateImage3() && validateImage4()) {
         
    } else {
        e.preventDefault();
        alert('Invalid data!');
        return false;
    }
});


// $(document).ready(function() {
//     $("#basic-form").validate();
//     });