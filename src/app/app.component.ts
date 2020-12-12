import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgForm } from '@angular/forms';
//const parser = require('subtitle-parsing-tool');
//import fs from 'browserify-fs';
//import * as ytdl from 'ytdl-core';

export interface TestCuePoint {
  id: string;
  tipo: number;
  pregunta: string;
  respuestas: Array<string>;
  respuesta_correcta: string;
}

export interface HuecosCuePoint {
  id: string;
  tipo: number;
  texto: string;
  respuesta: string;
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  api;
  json: JSON = JSON;
  newTestCue: TestCuePoint = {
    id: '',
    tipo: 0,
    pregunta: '',
    respuestas: [],
    respuesta_correcta: '',
  };
  newHuecosCue: HuecosCuePoint = {
    id: '',
    tipo: 0,
    texto: '',
    respuesta: 'patata',
  };
  vid: any;
  mensaje: string;
  showCuePointManager = false;
  acertado: boolean = false;
  activeCuePoints = [];
  posicion: number = 0;
  track: TextTrack;
  videos: File[] = [];
  vtts: File[] = [];
  selectedvtt;
  srcvideo;
  introducido;
  num_acertado: number = 0;
  num_total: number = 0;
  checkbox;
  repro_auto: boolean = false;
  yarespondido: boolean = false;

  constructor(private domSanitizer: DomSanitizer) {}

  // Control de videos externos

  // descargar_de_youtube() {
  //   const fs = require('fs');
  //   const ytdl = require('ytdl-core');
  //   ytdl('http://www.youtube.com/watch?v=aqz-KE-bpKQ').pipe(
  //     fs.createWriteStream('video.mp4')
  //   );
  // }

  onPlayerReady(api) {
    this.api = api;
    this.track = this.api.textTracks[0];
  }

  //Control archivos de video

  onSelect(event) {
    this.videos.push(...event.addedFiles);
    this.num_acertado = 0;
    this.num_total = 0;
    this.srcvideo = this.domSanitizer.bypassSecurityTrustResourceUrl(
      URL.createObjectURL(this.videos[this.videos.length - 1])
    );
    this.posicion = this.videos.length - 1;
    
  }
  
  onRemove(event) {
    if (this.videos.length == 1) {
      this.videos.splice(this.videos.indexOf(event), 1);
      this.posicion = 0;
      this.srcvideo = null;
    } else {
      this.videos.splice(this.videos.indexOf(event), 1);
      this.posicion = this.videos.indexOf(event);
      this.srcvideo = this.domSanitizer.bypassSecurityTrustResourceUrl(
        URL.createObjectURL(this.videos[this.videos.length - 1])
      );
    }
  }
  
  next_video() {
    this.posicion++;
    this.num_acertado = 0;
    this.num_total = 0;
    if (this.posicion == this.videos.length) {
      this.posicion = 0;
    }
    this.srcvideo = this.domSanitizer.bypassSecurityTrustResourceUrl(
      URL.createObjectURL(this.videos[this.posicion])
    );
  }
   
  repro_automatica() {
    this.checkbox = document.getElementById("repro_auto");
    this.vid = document.getElementById('video_int');
    if (this.checkbox.checked) {
      this.vid.autoplay = true
    }
    else {
      this.vid.autoplay = false
    }
  }

  //Control archivos de interactividad

  onSelectcue(event) {
    if (this.vtts.length! >= 1) {
      alert("Solo puede hacer un archivo de interactividad a la vez.")
    } else { 
      this.vtts.push(...event.addedFiles);
      this.selectedvtt = this.domSanitizer.bypassSecurityTrustResourceUrl(
        URL.createObjectURL(this.vtts[0])
      );
      this.vid = document.getElementById('video_int');
      this.vid.currentTime = 0;

    }
  }

  onRemovecue(event) {
    this.vtts.splice(this.vtts.indexOf(event), 1);
    this.selectedvtt = null;
    this.activeCuePoints = [];
  }

  //Control cuepoints de un archivo

  onEnterCuePoint($event) {
    this.activeCuePoints.push({ id: $event.id, ...JSON.parse($event.text) });
    this.vid.pause();
  }

  onExitCuePoint($event) {
    if (!this.yarespondido) {
      this.vid = document.getElementById('video_int');
      for (let i = 0; i < this.vid.textTracks[0].cues.length; i++) {
        if (this.vid.textTracks[0].cues[i].id == $event.id) {
          this.vid.currentTime = this.vid.textTracks[0].cues[i].startTime;
          this.activeCuePoints = this.activeCuePoints.filter(
          (c) => c.id !== $event.id
        );
        }
      }
    } else {
      this.activeCuePoints = this.activeCuePoints.filter(
        (c) => c.id !== $event.id
      );
      this.mensaje = '';
      this.acertado = false;
    }
    this.yarespondido = false;
  }

  //Edición de cuepoints

  onSubmit(form: NgForm, event: Event) {
    event.preventDefault();
    
    if (form.valid) {
      var jsonData = null;
      if (form.value.tipo == 1) { 
        jsonData = {
        startTime: form.value.startTime,
        endTime: form.value.endTime,
        tipo: form.value.tipo,
        pregunta: form.value.pregunta,
        respuestas: [form.value.respuesta1, form.value.respuesta2, form.value.respuesta3, form.value.respuesta4],
        correcta: form.value.correcta,
        };
      }
      
      if (form.value.tipo == 2) { 
        jsonData = {
        tipo: form.value.tipo,
        texto: form.value.texto, 
        n_textos: form.value.n_textos
        };
      }
      const jsonText = JSON.stringify(jsonData);
      var newVTT = new VTTCue(form.value.startTime, form.value.endTime, jsonText)
      this.track.addCue(
        newVTT
      );
    }
  }

  onClickRemove(cue: TextTrackCue) {
    this.track.removeCue(cue);
  }

  // Contron de preguntas
  
  resultados() {
    this.vid = document.getElementById('video_int');
    if (!(this.vtts.length > 0)) {
      if (this.vid.autoplay){
        this.next_video();
      }
      return
    }
    this.num_total = this.vid.textTracks[0].cues.length;
    
    if (this.num_acertado == this.num_total)
      alert("Felicidades! Has acertado todas las preguntas del video");
    else
      alert("Has acertado " + this.num_acertado + "/" + this.num_total + " preguntas");
    this.num_acertado = 0;
    this.num_total = 0;
    if (this.repro_auto) {
      this.next_video();
    }
  }

  comprobar_respuesta(respuesta, correcta) {
    if (this.yarespondido == true) { 
      return
    }
    this.yarespondido = true;
    if (respuesta == correcta) {
      if (!this.acertado == true) { 
        this.num_acertado++;
      
      }
      this.acertado = true;
      this.mensaje = 'Has acertado';
      this.vid = document.getElementById('video_int');
      

    } else {
      this.acertado = false;
      this.mensaje = 'Has fallado';
    }
    this.vid.play();
    this.introducido = '' 
  }

}
