import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Alert,
  Linking,
  Share,
} from 'react-native';
import axios from 'axios';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OlyoxTabBar from '../../components/common/UberTabBar';
import { useFetchUserDetails, useGetAllDetails } from '../../hooks/RiderDetailsHooks';
import { API_URL_WEB } from '../../../constant/api';
import { COLORS, SIZES, WEIGHTS, SPACING, RADIUS } from '../../../constant/ui';

// Modal Components
const DocumentsModal = ({ visible, onClose, documents }) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>📄 Documents</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
            <Text style={styles.closeIconText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {documents && (
            <>
              <DocumentItem 
                emoji="🪪" 
                title="Driver's License" 
                url={documents.license} 
              />
              <DocumentItem 
                emoji="📋" 
                title="Vehicle RC" 
                url={documents.rc} 
              />
              <DocumentItem 
                emoji="👤" 
                title="Profile Image" 
                url={documents.profile} 
              />
              <DocumentItem 
                emoji="🆔" 
                title="Aadhar Front" 
                url={documents.aadharFront} 
              />
              <DocumentItem 
                emoji="🆔" 
                title="Aadhar Back" 
                url={documents.aadharBack} 
              />
              <DocumentItem 
                emoji="🛡️" 
                title="Insurance" 
                url={documents.insurance} 
              />
            </>
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const DocumentItem = ({ emoji, title, url }) => (
  <TouchableOpacity 
    onPress={() => url && Linking.openURL(url)}
    style={styles.documentItem}
    disabled={!url}
  >
    <Text style={styles.documentEmoji}>{emoji}</Text>
    <Text style={styles.documentText}>{title}</Text>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

const VehicleDetailsModal = ({ visible, onClose, vehicleInfo }) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>🚗 Vehicle Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
            <Text style={styles.closeIconText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <DetailItem label="Vehicle Type" value={vehicleInfo?.vehicleType} />
          <DetailItem label="Vehicle Number" value={vehicleInfo?.VehicleNumber} />
          <DetailItem label="Model" value={vehicleInfo?.vehicleName} />
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const ProfileDetailsModal = ({ visible, onClose, allUserData }) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>👤 Profile Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
            <Text style={styles.closeIconText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <DetailItem label="Name" value={allUserData?.name} />
          <DetailItem label="Phone" value={allUserData?.phone} />
          <DetailItem label="Recharge Plan" value={allUserData?.RechargeData?.rechargePlan} />
          <DetailItem 
            label="Expiry Date" 
            value={allUserData?.RechargeData?.expireData ? 
              new Date(allUserData.RechargeData.expireData).toLocaleDateString('en-GB') : 'N/A'
            } 
          />
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// Helper Components
const DetailItem = ({ label, value }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || 'N/A'}</Text>
  </View>
);

const StatItem = ({ value, label, onClick, extraLabel }) => (
  <TouchableOpacity 
    style={[styles.statItem, onClick && styles.statItemClickable]}
    onPress={onClick}
    disabled={!onClick}
  >
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {extraLabel && <Text style={styles.statSubLabel}>{extraLabel}</Text>}
  </TouchableOpacity>
);

const MenuItem = ({ emoji, title, onPress, showBadge = false }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuLeft}>
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <Text style={styles.menuText}>{title}</Text>
    </View>
    <View style={styles.menuRight}>
      {showBadge && <View style={styles.badge} />}
      <Text style={styles.chevron}>›</Text>
    </View>
  </TouchableOpacity>
);

// Main Component
const Profile: React.FC = () => {
  const { userData:allUserData, fetchUserDetails: refetch } = useFetchUserDetails();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [showUpdateProfile, setShowUpdateProfile] = useState(false);
  const [checkBhData, setCheckBhData] = useState([]);

  useFocusEffect(
    useCallback(() => {
      refetch();
      if (allUserData?.BH) {
        checkBhDetails(allUserData.BH);
      }
      return () => {};
    }, [allUserData?.BH])
  );

  const checkBhDetails = async (BhId) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL_WEB}/check-bh-id`, {
        bh: BhId
      });
      console.log("Bh data",response.data?.complete)
      setCheckBhData(response.data?.complete|| []);
    } catch (error) {
      console.error('Error checking BH details:', error);
      Alert.alert('Error', 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalReferrals = useCallback(() => {
    if (!checkBhData) return
    
    const index = checkBhData
    return (
      (index?.Child_referral_ids?.length || 0) +
      (index?.Level1?.length || 0) +
      (index?.Level2?.length || 0) +
      (index?.Level3?.length || 0) +
      (index?.Level4?.length || 0) +
      (index?.Level5?.length || 0) +
      (index?.Level6?.length || 0) +
      (index?.Level7?.length || 0)
    );
  }, [checkBhData]);

  const shareOurApp = async () => {
    try {
      const result = await Share.share({
        message: `Join our ride-sharing platform! Use my referral code: ${allUserData?.BH}`,
        title: 'Join Our Platform',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const navigateToWithdraw = () => {
    navigation.navigate('Withdraw');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        },
      ]
    );
  };

  if (loading && !allUserData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <OlyoxTabBar activeTab={'profile'} isBottomShow={false}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {allUserData?.name ? allUserData.name[0].toUpperCase() : '?'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{allUserData?.name || 'Driver'}</Text>
              <Text style={styles.userPhone}>{allUserData?.phone || ''}</Text>
              <View style={styles.bhIdContainer}>
                <Text style={styles.bhIdLabel}>BH ID:</Text>
                <Text style={styles.bhIdValue}>{allUserData?.BH || ''}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <StatItem 
            value={allUserData?.TotalRides || 0} 
            label="Total Rides" 
          />
          
          <View style={styles.statDivider} />
          
          <StatItem 
            value={calculateTotalReferrals() || 0}
            label="Referrals"
          />
          
          <View style={styles.statDivider} />
          
          <StatItem 
            value={`₹${checkBhData[0]?.wallet || 0}`}
            label="Earnings"
            extraLabel="Tap to withdraw"
            onClick={navigateToWithdraw}
          />
        </View>

        {/* Menu Section */}
        <View style={styles.menuContainer}>
          <MenuItem 
            emoji="📄"
            title="View Documents"
            onPress={() => setShowDocuments(true)}
          />
          
          <MenuItem 
            emoji="👤"
            title="Profile Details"
            onPress={() => setShowUpdateProfile(true)}
          />
          
          <MenuItem 
            emoji="🎟️"
            title="Unlock Deals"
            onPress={() => navigation.navigate('UnlockCoupons')}
            showBadge={true}
          />
          
          <MenuItem 
            emoji="🚗"
            title="Vehicle Details"
            onPress={() => setShowVehicleDetails(true)}
          />
          
          <MenuItem 
            emoji="🎁"
            title="Refer & Earn"
            onPress={shareOurApp}
          />
          
          <MenuItem 
            emoji="👥"
            title="Referral History"
            onPress={() => navigation.navigate('referral-history')}
          />
          
          <MenuItem 
            emoji="🔄"
            title="Recharge History"
            onPress={() => navigation.navigate('recharge-history')}
          />
          
          <MenuItem 
            emoji="📱"
            title="Payment QR"
            onPress={() => navigation.navigate('upload-qr')}
          />
          
          <MenuItem 
            emoji="🚪"
            title="Logout"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>

      {/* Modals */}
      <DocumentsModal 
        visible={showDocuments}
        onClose={() => setShowDocuments(false)}
        documents={allUserData?.documents}
      />
      
      <VehicleDetailsModal 
        visible={showVehicleDetails}
        onClose={() => setShowVehicleDetails(false)}
        vehicleInfo={allUserData?.rideVehicleInfo}
      />
      
      <ProfileDetailsModal 
        visible={showUpdateProfile}
        onClose={() => setShowUpdateProfile(false)}
        allUserData={allUserData}
      />
    </OlyoxTabBar>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: verticalScale(SPACING.medium),
    fontSize: moderateScale(SIZES.medium),
    color: COLORS.darkGray,
    fontWeight: WEIGHTS.medium,
  },
  
  // Header Styles
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: scale(SPACING.xl),
    paddingTop: verticalScale(Platform.OS === 'ios' ? 60 : 40),
    paddingBottom: verticalScale(SPACING.xxxl),
    borderBottomLeftRadius: scale(RADIUS.xxxl),
    borderBottomRightRadius: scale(RADIUS.xxxl),
    marginBottom: verticalScale(SPACING.xl),
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(SPACING.xl),
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatarText: {
    fontSize: moderateScale(SIZES.xxxl + 8),
    fontWeight: WEIGHTS.bold,
    color: COLORS.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: moderateScale(SIZES.xxxl),
    fontWeight: WEIGHTS.bold,
    color: COLORS.light,
    marginBottom: verticalScale(SPACING.xs),
  },
  userPhone: {
    fontSize: moderateScale(SIZES.large),
    color: COLORS.light,
    opacity: 0.9,
    marginBottom: verticalScale(SPACING.small),
  },
  bhIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bhIdLabel: {
    fontSize: moderateScale(SIZES.medium),
    color: COLORS.light,
    opacity: 0.8,
    marginRight: scale(SPACING.xs),
  },
  bhIdValue: {
    fontSize: moderateScale(SIZES.medium),
    color: COLORS.light,
    fontWeight: WEIGHTS.semiBold,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: scale(SPACING.small),
    paddingVertical: verticalScale(2),
    borderRadius: scale(RADIUS.small),
  },

  // Stats Styles
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginHorizontal: scale(SPACING.xl),
    marginBottom: verticalScale(SPACING.xl),
    paddingVertical: verticalScale(SPACING.xl),
    borderRadius: scale(RADIUS.xl),
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(SPACING.small),
  },
  statItemClickable: {
    backgroundColor: 'rgba(229, 57, 53, 0.05)',
    borderRadius: scale(RADIUS.medium),
    marginHorizontal: scale(SPACING.xs),
  },
  statValue: {
    fontSize: moderateScale(SIZES.xl),
    fontWeight: WEIGHTS.bold,
    color: COLORS.primary,
    marginBottom: verticalScale(SPACING.xs),
  },
  statLabel: {
    fontSize: moderateScale(SIZES.small),
    color: COLORS.darkGray,
    textAlign: 'center',
    fontWeight: WEIGHTS.medium,
  },
  statSubLabel: {
    fontSize: moderateScale(SIZES.xs),
    color: COLORS.primary,
    marginTop: verticalScale(2),
    textAlign: 'center',
    fontWeight: WEIGHTS.medium,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: verticalScale(SPACING.small),
  },

  // Menu Styles
  menuContainer: {
    backgroundColor: COLORS.card,
    marginHorizontal: scale(SPACING.xl),
    marginBottom: verticalScale(SPACING.xl),
    borderRadius: scale(RADIUS.xl),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(SPACING.xl),
    paddingVertical: verticalScale(SPACING.large),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuEmoji: {
    fontSize: moderateScale(SIZES.xl),
    marginRight: scale(SPACING.medium),
  },
  menuText: {
    fontSize: moderateScale(SIZES.large),
    color: COLORS.text,
    fontWeight: WEIGHTS.medium,
    flex: 1,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: COLORS.primary,
    marginRight: scale(SPACING.small),
  },
  chevron: {
    fontSize: moderateScale(SIZES.xl),
    color: COLORS.gray,
    fontWeight: WEIGHTS.light,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: scale(RADIUS.xxl),
    borderTopRightRadius: scale(RADIUS.xxl),
    maxHeight: '80%',
    paddingBottom: verticalScale(Platform.OS === 'ios' ? 34 : SPACING.xl),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(SPACING.xl),
    paddingVertical: verticalScale(SPACING.xl),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: moderateScale(SIZES.xxl),
    fontWeight: WEIGHTS.bold,
    color: COLORS.text,
  },
  closeIcon: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconText: {
    fontSize: moderateScale(SIZES.large),
    color: COLORS.darkGray,
    fontWeight: WEIGHTS.medium,
  },

  // Document Item Styles
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(SPACING.xl),
    paddingVertical: verticalScale(SPACING.large),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  documentEmoji: {
    fontSize: moderateScale(SIZES.xl),
    marginRight: scale(SPACING.medium),
  },
  documentText: {
    flex: 1,
    fontSize: moderateScale(SIZES.large),
    color: COLORS.text,
    fontWeight: WEIGHTS.medium,
  },

  // Detail Item Styles
  detailItem: {
    paddingHorizontal: scale(SPACING.xl),
    paddingVertical: verticalScale(SPACING.large),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  detailLabel: {
    fontSize: moderateScale(SIZES.medium),
    color: COLORS.darkGray,
    marginBottom: verticalScale(SPACING.xs),
    fontWeight: WEIGHTS.medium,
  },
  detailValue: {
    fontSize: moderateScale(SIZES.large),
    color: COLORS.text,
    fontWeight: WEIGHTS.semiBold,
  },
});