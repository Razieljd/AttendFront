import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  url = 'https://attend-1.herokuapp.com/user';
  apikey = 'jose';

  constructor(private http: HttpClient) {

    
  }
  getUserbyId(id){
    return this.http.get(`${this.url}/${id}`);
  }
}
