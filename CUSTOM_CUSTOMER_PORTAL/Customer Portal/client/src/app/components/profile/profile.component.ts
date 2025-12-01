import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SapApiService } from '../../services/sap-api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  isLoading: boolean = true;
  profileData: any = null; // This will hold the { CUSTOMER_ID: ... } object
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private sapApi: SapApiService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  get initials(): string {
    if (!this.profileData) return 'U';
    const name = (this.profileData.NAME && Array.isArray(this.profileData.NAME) && this.profileData.NAME[0]) || (this.profileData.CUSTOMER_ID && this.profileData.CUSTOMER_ID[0]) || 'U';
    try {
      const parts = String(name).toString().split(/\s+/).filter(Boolean);
      const letters = parts.map(p => p[0]).slice(0,2).join('').toUpperCase();
      return letters || String(name).slice(0,2).toUpperCase();
    } catch (e) {
      return String(name).slice(0,2).toUpperCase();
    }
  }

  loadProfile(): void {
    const customerId = this.authService.getCustomerId();
    if (!customerId) {
      this.errorMessage = 'Customer ID not found';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.sapApi.getProfile(customerId).subscribe({
      next: (response) => {
        
        // *** THIS IS THE FIX ***
        // Extract the actual profile object from the nested structure
        if (response.data && response.data.ES_PROFILE && Array.isArray(response.data.ES_PROFILE) && response.data.ES_PROFILE.length > 0) {
          this.profileData = response.data.ES_PROFILE[0];
          console.log('Profile data loaded:', this.profileData);
        } else {
          this.profileData = null;
          this.errorMessage = 'Profile data not found in API response.';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.fault?.faultstring || error.error?.error || 'Failed to load profile';
        this.isLoading = false;
      }
    });
  }

  /**
   * This function now iterates over the correct profile object
   * and "flattens" the SAP arrays.
   */
  getProfileFields(): Array<{label: string, value: any}> {
    if (!this.profileData) return [];
    
    const fields: Array<{label: string, value: any}> = [];
    
    // this.profileData is now { CUSTOMER_ID: ["..."], NAME: ["..."], ... }
    for (const [key, sapArray] of Object.entries(this.profileData)) {
      
      // 1. Create a clean label (e.g., "CUSTOMER_ID" -> "Customer Id")
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      // 2. Extract the single value from the SAP array (flatten it)
      let value = 'N/A';
      if (Array.isArray(sapArray) && sapArray.length > 0 && sapArray[0] !== '') {
        value = sapArray[0];
      }

      fields.push({ label, value });
    }
    return fields;
  }
}