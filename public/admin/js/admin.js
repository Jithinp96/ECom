
   
document.addEventListener("DOMContentLoaded", function () {
    const maxImageCount = 6;
    const previewContainer = document.getElementById("previewContainer");
  
    document
      .getElementById("imageInput")
      .addEventListener("change", function (e) {
        const selectedFiles = e.target.files;
        if (selectedFiles.length > maxImageCount) {
          alert(`Maximum ${maxImageCount} images allowed.`);
          e.target.value = ""; // Clear the file input
        } else {
          updateImagePreviews(selectedFiles);
        }
      });
  
    function updateImagePreviews(files) {
      previewContainer.innerHTML = ""; // Clear the existing previews
  
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        const previewImage = document.createElement("img");
        previewImage.className = "preview-image";
  
        reader.onload = (function (img) {
          return function (e) {
            img.src = e.target.result;
          };
        })(previewImage);
  
        reader.readAsDataURL(files[i]);
        previewContainer.appendChild(previewImage);
      }
    }
  });