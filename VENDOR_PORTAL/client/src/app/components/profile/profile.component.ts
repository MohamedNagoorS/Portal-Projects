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
  profileData: any = null;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private sapApi: SapApiService
  ) { }

  ngOnInit(): void {
    this.loadProfile();
  }

  get initials(): string {
    if (!this.profileData) return 'U';
    const name = (this.profileData.NAME && Array.isArray(this.profileData.NAME) && this.profileData.NAME[0]) || (this.profileData.VENDOR_ID && this.profileData.VENDOR_ID[0]) || 'U';
    try {
      const parts = String(name).toString().split(/\s+/).filter(Boolean);
      const letters = parts.map(p => p[0]).slice(0, 2).join('').toUpperCase();
      return letters || String(name).slice(0, 2).toUpperCase();
    } catch (e) {
      return String(name).slice(0, 2).toUpperCase();
    }
  }

  loadProfile(): void {
    const vendorId = this.authService.getVendorId();
    if (!vendorId) {
      this.errorMessage = 'Vendor ID not found';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.sapApi.getProfile(vendorId).subscribe({
      next: (response) => {
        // Handle various SAP response structures
        if (response.data && response.data.ET_PROFILE && Array.isArray(response.data.ET_PROFILE) && response.data.ET_PROFILE.length > 0) {
          const table = response.data.ET_PROFILE[0];
          if (table.item && Array.isArray(table.item) && table.item.length > 0) {
            this.profileData = table.item[0];
          } else {
            this.profileData = table;
          }
        } else if (response.data && response.data.ES_PROFILE && Array.isArray(response.data.ES_PROFILE) && response.data.ES_PROFILE.length > 0) {
          this.profileData = response.data.ES_PROFILE[0];
        } else if (response.data && response.data.ES_VENDOR_PROFILE && Array.isArray(response.data.ES_VENDOR_PROFILE) && response.data.ES_VENDOR_PROFILE.length > 0) {
          this.profileData = response.data.ES_VENDOR_PROFILE[0];
        } else {
          this.profileData = response.data;
        }

        console.log('Profile data loaded:', this.profileData);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.fault?.faultstring || error.error?.error || 'Failed to load profile';
        this.isLoading = false;
      }
    });
  }

  getProfileFields(): Array<{ label: string, value: any }> {
    if (!this.profileData) return [];

    const fields: Array<{ label: string, value: any }> = [];

    for (const [key, sapArray] of Object.entries(this.profileData)) {
      if (key === '$') continue;

      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      let value: any = 'N/A';
      if (Array.isArray(sapArray) && sapArray.length > 0 && sapArray[0] !== '') {
        value = sapArray[0];
      } else if (!Array.isArray(sapArray)) {
        value = sapArray;
      }

      fields.push({ label, value });
    }
    return fields;
  }
}