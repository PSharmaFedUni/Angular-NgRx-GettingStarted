import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { catchError, tap, map } from 'rxjs/operators';

import { Product } from './product';

@Injectable()
export class ProductService {
  private productsUrl = 'api/products';
  private products: Product[];

  private selectedProductSource = new BehaviorSubject<Product | null>(null);
  selectedProductChanges$ = this.selectedProductSource.asObservable();

  constructor(private http: HttpClient) { }

  changeSelectedProduct(selectedProduct: Product | null): void {
    this.selectedProductSource.next(selectedProduct);
  }

  getProducts(): Observable<Product[]> {
    if (this.products) {
      return of(this.products);
    }
    return this.http.get<Product[]>(this.productsUrl)
      .pipe(
        tap(data => console.log(JSON.stringify(data))),
        tap(data => this.products = data),
        catchError(this.handleError)
      );
  }

  // Return an initialized product
  newProduct(): Product {
    return this.initializeProduct();
  }

  createProduct(product: Product): Observable<Product> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    product.id = null;
    return this.http.post<Product>(this.productsUrl, product, { headers: headers })
      .pipe(
        tap(data => console.log('createProduct: ' + JSON.stringify(data))),
        tap(data => {
          this.products.push(data);
        }),
        catchError(this.handleError)
      );
  }

  deleteProduct(id: number): Observable<Product> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = `${this.productsUrl}/${id}`;
    return this.http.delete<Product>(url, { headers: headers })
      .pipe(
        tap(data => console.log('deleteProduct: ' + id)),
        tap(data => {
          const foundIndex = this.products.findIndex(item => item.id === id);
          if (foundIndex > -1) {
            this.products.splice(foundIndex, 1);
          }
        }),
        catchError(this.handleError)
      );
  }

  updateProduct(product: Product): Observable<Product> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = `${this.productsUrl}/${product.id}`;
    return this.http.put<Product>(url, product, { headers: headers })
      .pipe(
        tap(() => console.log('updateProduct: ' + product.id)),
        // Update the item in the list
        // This is required because the selected product that was edited
        // was a copy of the item from the array.
        tap(() => {
          const foundIndex = this.products.findIndex(item => item.id === product.id);
          if (foundIndex > -1) {
            this.products[foundIndex] = product;
          }
        }),
        // Return the product on an update
        map(() => product),
        catchError(this.handleError)
      );
  }

  private initializeProduct(): Product {
    // Return an initialized object
    return {
      'id': 0,
      productName: '',
      productCode: '',
      description: '',
      starRating: 0
    };
  }

  private handleError(err: HttpErrorResponse): ErrorObservable {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof Error) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}, body was: ${err.error}`;
    }
    console.error(err);
    return new ErrorObservable(errorMessage);
  }

}
