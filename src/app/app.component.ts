import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  
  posicion: number = 0;
  selectedvideo: string = "";
  lista_videos: Array<string> = ["//vjs.zencdn.net/v/oceans.mp4", "https://cdn.videvo.net/videvo_files/video/free/2014-12/small_watermarked/Raindrops_Videvo_preview.webm"];

  constructor() { 
    this.selectedvideo = "//vjs.zencdn.net/v/oceans.mp4"
  }

  next_video() {
    this.posicion++;
    if (this.posicion == this.lista_videos.length){ 
      this.posicion = 0;
    }
    console.log(this.posicion)
    this.selectedvideo = this.lista_videos[this.posicion];
    console.log(this.selectedvideo)
  }

}
