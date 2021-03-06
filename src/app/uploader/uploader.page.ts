import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { Component, OnInit } from '@angular/core';
import { File } from '@ionic-native/file/ngx';
import { Platform } from '@ionic/angular';
import { AngularFireStorage } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { FileChooser } from '@ionic-native/file-chooser/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import firebase from 'firebase/app';



@Component({
  selector: 'app-uploader',
  templateUrl: './uploader.page.html',
  styleUrls: ['./uploader.page.scss'],
})
export class UploaderPage implements OnInit {
  public uploadPercent: Observable<number>;
  public downloadUrl: Observable<string>;
  
 constructor(
  private fileChooser: FileChooser,
  private filePath : FilePath,
  private camera : Camera,
  private platform: Platform,
  private file: File,
  private afStorage: AngularFireStorage){

 }

  ngOnInit() {
  }
 
  async openGalery(){
    const options: CameraOptions = {
      quality:100,
      destinationType: this.camera.DestinationType.FILE_URI,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      correctOrientation: true
    };

    try{
      const fileUri: string = await this.camera.getPicture(options);

      let file: string;

      if(this.platform.is('android')) {
        file = fileUri.split('/').pop();
      }else{
        file = fileUri.substring(fileUri.lastIndexOf('/') + 1, fileUri.indexOf('?'));
      }

      const path: string = fileUri.substring(0, fileUri.lastIndexOf('/'));

      const buffer: ArrayBuffer = await this.file.readAsArrayBuffer(path,file);
      const blob: Blob = new Blob([buffer],{type: 'image/jpeg'});

      this.uploadPicture(blob);
    }catch(error){
      console.log(error);
    }

  }
  uploadPicture(blob: Blob){
    const ref = this.afStorage.ref('ionic.jpg');
    const task = ref.put(blob);

    this.uploadPercent = task.percentageChanges();

    task.snapshotChanges().pipe(
      finalize(() => this.downloadUrl = ref.getDownloadURL())
    ).subscribe();
  }
  choose() {
    this.fileChooser.open().then((uri) => {
      alert(uri);

      this.filePath.resolveNativePath(uri).then(filePath => {
        alert(filePath);
        let dirPathSegments = filePath.split('/');
        let fileName = dirPathSegments[dirPathSegments.length-1];
        dirPathSegments.pop();
        let dirPath = dirPathSegments.join('/');
        this.file.readAsArrayBuffer(dirPath, fileName).then(async (buffer) => {
          await this.upload(buffer, fileName);
        }).catch((err) => {
          alert(err.toString());
        });
      });
    });
  }
  async upload(buffer,name){
    let blob = new Blob([buffer], {type:"image/jpeg/pdf/doc"});

    let storage = firebase.storage();

    storage.ref('images/' + name).put(blob).then((d)=>{
      alert("Done");
    }).catch((error)=>{
      alert(JSON.stringify(error))
    })
  }
}
