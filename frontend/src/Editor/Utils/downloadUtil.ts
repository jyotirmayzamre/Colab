import Swal from "sweetalert2";

const handleDownload = (value: string) => {
  try{
    //first obtain the state of the version and convert it to text
    const link = document.createElement('a');
    link.setAttribute('download', 'download.doc');
    link.setAttribute('href', 'data:' + 'text/doc' + ';charset=utf-8,' + encodeURIComponent(value));
    link.click();
  } catch{
      Swal.fire({
        title: 'Error!',
        text: 'Could not download document :(',
        icon: 'error',
        showConfirmButton: false,
        toast: true,
        timer: 3000,
        position: 'top',
      })
  }
}

export default handleDownload;
