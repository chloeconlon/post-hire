
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
//export vendor interface and details
export interface Vendors {
  id: string;
  name: string;
  bio: string;
  email: string;
  experience: string;
  jobField: string;
  phoneNo: string;
  profilePicture: string;
  rate: number;
  businessName: string;
  workDays: string[];
  jobPosition: string;
  serviceArea: string[];
  startTime: string;
  endTime: string;

}

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  private firestore: Firestore = inject(Firestore);


  getVendors(): Observable<Vendors[]> {

    const itemCollection = collection(this.firestore, 'vendors');


    return collectionData(itemCollection, { idField: 'id' }) as Observable<Vendors[]>;
  }

  getVendorById(id: string): Observable<Vendors | undefined> {
    const vendorDocument = doc(this.firestore, `vendors/${id}`);

    return docData(vendorDocument, { idField: 'id' }) as Observable<Vendors | undefined>;
  }
}
